import { mock } from "jest-mock-extended";
import { MoreThanOrEqual, LessThanOrEqual, Between, SelectQueryBuilder } from "typeorm";
import * as paginator from "nestjs-typeorm-paginate";
import { hexTransformer } from "./transformers/hex.transformer";
import { BaseEntity } from "./entities/base.entity";
import {
  buildBlockFilter,
  copyOrderBy,
  paginate,
  formatHexAddress,
  getMethodId,
  dateToTimestamp,
  numberToHex,
  parseIntToHex,
  parseReqPathname,
  isAddressEqual,
  computeFromToMinMax,
} from "./utils";
import { IPaginationOptions } from "./types";

jest.mock("nestjs-typeorm-paginate");

describe("utils", () => {
  describe("buildBlockFilter", () => {
    it("builds Between filter when both fromBlock and toBlock are provided", () => {
      const fromBlock = 100;
      const toBlock = 200;
      const result = buildBlockFilter(fromBlock, toBlock);
      expect(result).toEqual({
        number: Between(fromBlock, toBlock),
      });
    });

    it("builds MoreThanOrEqual filter when only fromBlock is provided", () => {
      const fromBlock = 100;
      const result = buildBlockFilter(fromBlock, undefined);
      expect(result).toEqual({
        number: MoreThanOrEqual(fromBlock),
      });
    });

    it("builds LessThanOrEqual filter when only toBlock is provided", () => {
      const toBlock = 200;
      const result = buildBlockFilter(undefined, toBlock);
      expect(result).toEqual({
        number: LessThanOrEqual(toBlock),
      });
    });

    it("applies custom field name when specified", () => {
      const toBlock = 200;
      const result = buildBlockFilter(undefined, toBlock, "blockNumber");
      expect(result).toEqual({
        blockNumber: LessThanOrEqual(toBlock),
      });
    });
  });

  describe("copyOrderBy", () => {
    it("remaps aliased order by keys to the target alias", () => {
      const source = mock<SelectQueryBuilder<BaseEntity>>();
      const target = mock<SelectQueryBuilder<BaseEntity>>();
      (source as any).expressionMap = { orderBys: { "at.blockNumber": "DESC", "at.transactionIndex": "DESC" } };

      copyOrderBy(source, target, "transaction");

      expect(target.addOrderBy).toHaveBeenCalledWith("transaction.blockNumber", "DESC");
      expect(target.addOrderBy).toHaveBeenCalledWith("transaction.transactionIndex", "DESC");
    });

    it("handles keys without alias prefix", () => {
      const source = mock<SelectQueryBuilder<BaseEntity>>();
      const target = mock<SelectQueryBuilder<BaseEntity>>();
      (source as any).expressionMap = { orderBys: { blockNumber: "ASC" } };

      copyOrderBy(source, target, "transfer");

      expect(target.addOrderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
    });

    it("does nothing when orderBys is empty", () => {
      const source = mock<SelectQueryBuilder<BaseEntity>>();
      const target = mock<SelectQueryBuilder<BaseEntity>>();
      (source as any).expressionMap = { orderBys: {} };

      copyOrderBy(source, target, "log");

      expect(target.addOrderBy).not.toHaveBeenCalled();
    });

    it("preserves NULLS FIRST / NULLS LAST when value is an object", () => {
      const source = mock<SelectQueryBuilder<BaseEntity>>();
      const target = mock<SelectQueryBuilder<BaseEntity>>();
      (source as any).expressionMap = {
        orderBys: { "token.liquidity": { order: "DESC", nulls: "NULLS LAST" } },
      };

      copyOrderBy(source, target, "transfer");

      expect(target.addOrderBy).toHaveBeenCalledWith("transfer.liquidity", "DESC", "NULLS LAST");
    });
  });

  describe("paginate", () => {
    let queryBuilder: SelectQueryBuilder<BaseEntity>;
    let clonedQb: SelectQueryBuilder<BaseEntity>;
    let countMainQb: SelectQueryBuilder<BaseEntity>;
    let options: IPaginationOptions;

    beforeEach(() => {
      clonedQb = mock<SelectQueryBuilder<BaseEntity>>();
      countMainQb = mock<SelectQueryBuilder<BaseEntity>>();

      queryBuilder = mock<SelectQueryBuilder<BaseEntity>>({
        connection: {
          createQueryBuilder: jest.fn().mockReturnValue(countMainQb),
        },
      });
      (queryBuilder.clone as jest.Mock).mockReturnValue(clonedQb);
      (clonedQb.clone as jest.Mock).mockReturnValue(clonedQb);

      (clonedQb.getMany as jest.Mock).mockResolvedValue([]);
      (countMainQb.getRawOne as jest.Mock).mockResolvedValue({ value: "50" });

      options = { page: 1, limit: 10, route: "/entities" };

      (paginator.createPaginationObject as jest.Mock).mockReturnValue({
        items: [],
        meta: {},
        links: {},
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("clones the QB for both count and pagination", async () => {
      await paginate({ queryBuilder, options });
      expect(queryBuilder.clone).toHaveBeenCalled();
    });

    it("strips joins from count subquery", async () => {
      (clonedQb as any).expressionMap = { joinAttributes: [{ alias: "someJoin" }] };
      await paginate({ queryBuilder, options });
      expect(clonedQb.expressionMap.joinAttributes).toEqual([]);
    });

    it("applies limit and offset to paginated clone", async () => {
      await paginate({ queryBuilder, options: { ...options, page: 3 } });
      expect(clonedQb.limit).toHaveBeenCalledWith(10);
      expect(clonedQb.offset).toHaveBeenCalledWith(20);
    });

    it("executes getMany on paginated clone when no wrapQuery is provided", async () => {
      await paginate({ queryBuilder, options });
      expect(clonedQb.getMany).toHaveBeenCalledTimes(1);
    });

    it("uses number filter instead of offset when canUseNumberFilterAsOffset is set and offset >= 1000", async () => {
      const topItemClone = mock<SelectQueryBuilder<BaseEntity>>();
      (topItemClone.limit as jest.Mock).mockReturnThis();
      (topItemClone.getOne as jest.Mock).mockResolvedValue({ number: 5000 });

      (clonedQb.clone as jest.Mock).mockReturnValue(topItemClone);
      (clonedQb.andWhere as jest.Mock).mockReturnThis();

      await paginate({
        queryBuilder,
        options: { ...options, page: 101, canUseNumberFilterAsOffset: true },
        countQuery: async () => 10000,
      });

      expect(clonedQb.andWhere).toHaveBeenCalledWith({
        number: LessThanOrEqual(4000),
      });
      expect(clonedQb.offset).toHaveBeenCalledWith(0);
    });

    it("uses -1 as topItemNumber when no items exist for canUseNumberFilterAsOffset", async () => {
      const topItemClone = mock<SelectQueryBuilder<BaseEntity>>();
      (topItemClone.limit as jest.Mock).mockReturnThis();
      (topItemClone.getOne as jest.Mock).mockResolvedValue(null);

      (clonedQb.clone as jest.Mock).mockReturnValue(topItemClone);
      (clonedQb.andWhere as jest.Mock).mockReturnThis();

      await paginate({
        queryBuilder,
        options: { ...options, page: 101, canUseNumberFilterAsOffset: true },
        countQuery: async () => 10000,
      });

      expect(clonedQb.andWhere).toHaveBeenCalledWith({
        number: LessThanOrEqual(-1001),
      });
    });

    it("skips clearing joins when expressionMap is nullish", async () => {
      (clonedQb as any).expressionMap = null;
      await paginate({ queryBuilder, options });
      expect(clonedQb.getMany).toHaveBeenCalledTimes(1);
    });

    it("calls wrapQuery with paginated QB and executes getMany on the returned QB", async () => {
      const outerQb = mock<SelectQueryBuilder<BaseEntity>>();
      (outerQb.getMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      const wrapQuery = jest.fn().mockResolvedValue(outerQb);

      await paginate({ queryBuilder, options, wrapQuery });

      expect(wrapQuery).toHaveBeenCalledWith(clonedQb);
      expect(outerQb.getMany).toHaveBeenCalledTimes(1);
    });

    it("uses custom countQuery instead of building one", async () => {
      const customCount = jest.fn().mockResolvedValue(999);

      await paginate({ queryBuilder, options, countQuery: customCount });

      expect(customCount).toHaveBeenCalledTimes(1);
      expect(paginator.createPaginationObject).toHaveBeenCalledWith(expect.objectContaining({ totalItems: 999 }));
    });

    it("creates pagination object with correct parameters", async () => {
      const items = [{ id: 1 }, { id: 2 }] as any;
      (clonedQb.getMany as jest.Mock).mockResolvedValue(items);
      (countMainQb.getRawOne as jest.Mock).mockResolvedValue({ value: "100" });

      await paginate({ queryBuilder, options });

      expect(paginator.createPaginationObject).toHaveBeenCalledWith({
        items,
        totalItems: 100,
        currentPage: 1,
        limit: 10,
        route: "/entities",
      });
    });

    it("appends filter options to pagination links", async () => {
      const paginatedResult = {
        links: {
          first: "?page=1&limit=10",
          last: "?page=2&limit=10",
          previous: "",
        },
      };
      (paginator.createPaginationObject as jest.Mock).mockReturnValue(paginatedResult);

      const result = await paginate({
        queryBuilder,
        options: { ...options, filterOptions: { fromBlock: 100, toBlock: null } },
      });

      expect(result.links).toEqual({
        first: "?page=1&limit=10&fromBlock=100",
        last: "?page=2&limit=10&fromBlock=100",
        previous: "",
      });
    });

    it("returns result as-is when links is not present", async () => {
      const paginatedResult = { items: [], meta: {} };
      (paginator.createPaginationObject as jest.Mock).mockReturnValue(paginatedResult);

      const result = await paginate({
        queryBuilder,
        options: { ...options, filterOptions: { fromBlock: 100 } },
      });

      expect(result).toBe(paginatedResult);
    });

    it("does not modify links when no filterOptions are provided", async () => {
      const paginatedResult = {
        links: {
          first: "?page=1&limit=10",
          last: "?page=1&limit=10",
          previous: "",
        },
      };
      (paginator.createPaginationObject as jest.Mock).mockReturnValue(paginatedResult);

      const result = await paginate({ queryBuilder, options });

      expect(result.links).toEqual({
        first: "?page=1&limit=10",
        last: "?page=1&limit=10",
        previous: "",
      });
    });
  });

  describe("formatHexAddress", () => {
    it("formats hex address using hexTransformer", () => {
      jest.spyOn(hexTransformer, "from").mockReturnValue("from");
      jest.spyOn(hexTransformer, "to").mockReturnValue("to");

      expect(formatHexAddress("address")).toBe("from");
      expect(hexTransformer.to).toBeCalledWith("address");
      expect(hexTransformer.from).toBeCalledWith("to");
    });
  });

  describe("getMethodId", () => {
    it("returns 0x when data is empty", () => {
      expect(getMethodId("0x")).toBe("0x");
    });

    it("returns first 10 chars of data when data is not empty", () => {
      expect(getMethodId("0x1234567890")).toBe("0x12345678");
    });
  });

  describe("dateToTimestamp", () => {
    it("returns timestamp seconds for the date", () => {
      expect(dateToTimestamp(new Date("2022-11-21T18:16:51.000Z"))).toBe(1669054611);
    });
  });

  describe("numberToHex", () => {
    it("returns hex str for the specified number", () => {
      expect(numberToHex(1000)).toBe("0x3e8");
    });

    it("returns 0x if the specified number is null", () => {
      expect(numberToHex(null)).toBe("0x");
    });

    it("returns 0x if the specified number is undefined", () => {
      expect(numberToHex(undefined)).toBe("0x");
    });

    it("returns hex str for the specified bigint", () => {
      expect(numberToHex(BigInt("1000000000000000000000000"))).toBe("0xd3c21bcecceda1000000");
    });

    it("returns 0x if the specified bigint is null", () => {
      expect(numberToHex(null)).toBe("0x");
    });

    it("returns 0x if the specified bigint is undefined", () => {
      expect(numberToHex(undefined)).toBe("0x");
    });
  });

  describe("parseIntToHex", () => {
    it("returns hex str for the specified number as a string", () => {
      expect(parseIntToHex("1000")).toBe("0x3e8");
    });

    it("returns 0x if the specified number is null", () => {
      expect(parseIntToHex(null)).toBe("0x");
    });

    it("returns 0x if the specified number is undefined", () => {
      expect(parseIntToHex(undefined)).toBe("0x");
    });

    it("returns 0x if the specified number is not valid int", () => {
      expect(parseIntToHex("azxf")).toBe("0x");
    });
  });

  describe("parseReqPathname", () => {
    it("returns the pathname for a simple path", () => {
      const req = {
        originalUrl: "/test",
      } as any;
      expect(parseReqPathname(req)).toBe("/test");
    });

    it("returns the pathname when query parameters are present", () => {
      const req = {
        originalUrl: "/test?foo=bar&baz=qux",
      } as any;
      expect(parseReqPathname(req)).toBe("/test");
    });

    it("returns the pathname for a complex path", () => {
      const req = {
        originalUrl: "/api/v1/items/123",
      } as any;
      expect(parseReqPathname(req)).toBe("/api/v1/items/123");
    });

    it("returns '/' for the root path", () => {
      const req = {
        originalUrl: "/",
      } as any;
      expect(parseReqPathname(req)).toBe("/");
    });

    it("returns '/' for an empty originalUrl (which URL constructor treats as base path)", () => {
      const req = {
        originalUrl: "",
      } as any;
      // new URL("", "http://localhost") results in "http://localhost/"
      expect(parseReqPathname(req)).toBe("/");
    });

    it("handles full URLs in originalUrl and extract pathname", () => {
      const req = {
        originalUrl: "http://example.com/path/to/resource?query=1",
      } as any;
      expect(parseReqPathname(req)).toBe("/path/to/resource");
    });
  });

  describe("isAddressEqual", () => {
    it("returns true when both addresses are identical and valid", () => {
      const address = "0x1234567890123456789012345678901234567890";
      expect(isAddressEqual(address, address)).toBe(true);
    });

    it("returns true when both addresses are the same but one is checksummed", () => {
      const address1 = "0x1234567890123456789012345678901234567890";
      const address2 = "0x1234567890123456789012345678901234567890";
      expect(isAddressEqual(address1, address2)).toBe(true);
    });

    it("returns false when addresses are different", () => {
      const address1 = "0x1234567890123456789012345678901234567890";
      const address2 = "0x0987654321098765432109876543210987654321";
      expect(isAddressEqual(address1, address2)).toBe(false);
    });

    it("returns false when first address is invalid", () => {
      expect(isAddressEqual("0xinvalid", "0x1234567890123456789012345678901234567890")).toBe(false);
    });

    it("returns false when second address is invalid", () => {
      expect(isAddressEqual("0x1234567890123456789012345678901234567890", "0xinvalid")).toBe(false);
    });

    it("returns false when both addresses are invalid", () => {
      expect(isAddressEqual("0xinvalid", "0xalsoinvalid")).toBe(false);
    });

    it("returns false when addresses are empty strings", () => {
      expect(isAddressEqual("", "")).toBe(false);
    });

    it("returns false when one address is empty", () => {
      const validAddress = "0x1234567890123456789012345678901234567890";
      expect(isAddressEqual("", validAddress)).toBe(false);
      expect(isAddressEqual(validAddress, "")).toBe(false);
    });

    it("returns false when addresses are too short", () => {
      expect(isAddressEqual("0x123", "0x456")).toBe(false);
    });

    it("returns false when addresses are too long", () => {
      expect(
        isAddressEqual(
          "0x12345678901234567890123456789012345678901234567890",
          "0x98765432109876543210987654321098765432109876543210"
        )
      ).toBe(false);
    });

    it("returns false when addresses are not hex strings", () => {
      expect(isAddressEqual("not-an-address", "also-not-an-address")).toBe(false);
    });

    it("handles null and undefined gracefully", () => {
      const validAddress = "0x1234567890123456789012345678901234567890";
      expect(isAddressEqual(null as any, validAddress)).toBe(false);
      expect(isAddressEqual(validAddress, null as any)).toBe(false);
      expect(isAddressEqual(undefined as any, validAddress)).toBe(false);
      expect(isAddressEqual(validAddress, undefined as any)).toBe(false);
      expect(isAddressEqual(null as any, null as any)).toBe(false);
      expect(isAddressEqual(undefined as any, undefined as any)).toBe(false);
    });
  });

  describe("computeFromToMinMax", () => {
    it("returns fromToMin=from and fromToMax=to when from < to lexicographically", () => {
      const from = "0xaaa";
      const to = "0xbbb";
      expect(computeFromToMinMax(from, to)).toEqual({ fromToMin: from, fromToMax: to });
    });

    it("returns fromToMin=to and fromToMax=from when from > to lexicographically", () => {
      const from = "0xbbb";
      const to = "0xaaa";
      expect(computeFromToMinMax(from, to)).toEqual({ fromToMin: to, fromToMax: from });
    });

    it("returns fromToMin=from and fromToMax=to when from equals to", () => {
      const addr = "0xaaa";
      expect(computeFromToMinMax(addr, addr)).toEqual({ fromToMin: addr, fromToMax: addr });
    });

    it("compares addresses case-insensitively", () => {
      const from = "0xAAA";
      const to = "0xbbb";
      expect(computeFromToMinMax(from, to)).toEqual({ fromToMin: from, fromToMax: to });
    });

    it("returns nulls when from is falsy", () => {
      expect(computeFromToMinMax(null, "0xbbb")).toEqual({ fromToMin: null, fromToMax: null });
    });

    it("returns nulls when to is undefined", () => {
      expect(computeFromToMinMax("0xaaa", undefined)).toEqual({ fromToMin: null, fromToMax: null });
    });

    it("returns nulls when both are falsy", () => {
      expect(computeFromToMinMax(null, null)).toEqual({ fromToMin: null, fromToMax: null });
    });
  });
});
