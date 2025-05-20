import { mock } from "jest-mock-extended";
import { MoreThanOrEqual, LessThanOrEqual, Between, SelectQueryBuilder } from "typeorm";
import * as paginator from "nestjs-typeorm-paginate";
import { hexTransformer } from "./transformers/hex.transformer";
import { BaseEntity } from "../common/entities/base.entity";
import {
  buildDateFilter,
  paginate,
  formatHexAddress,
  getMethodId,
  dateToTimestamp,
  numberToHex,
  parseIntToHex,
} from "./utils";
import { IPaginationOptions } from "./types";

jest.mock("nestjs-typeorm-paginate");

describe("utils", () => {
  describe("buildDateFilter", () => {
    it("builds Between date filter when both fromDate and toDate are provided", () => {
      const fromDate = "2022-11-10T14:44:08.000Z";
      const toDate = "2023-11-10T14:44:08.000Z";
      const result = buildDateFilter(fromDate, toDate);
      expect(result).toEqual({
        timestamp: Between(new Date(fromDate), new Date(toDate)),
      });
    });

    it("builds MoreThanOrEqual date filter when only fromDate is provided", () => {
      const fromDate = "2022-11-10T14:44:08.000Z";
      const result = buildDateFilter(fromDate, null);
      expect(result).toEqual({
        timestamp: MoreThanOrEqual(new Date(fromDate)),
      });
    });

    it("builds LessThanOrEqual date filter when only toDate is provided", () => {
      const toDate = "2022-11-10T14:44:08.000Z";
      const result = buildDateFilter(null, toDate);
      expect(result).toEqual({
        timestamp: LessThanOrEqual(new Date(toDate)),
      });
    });

    it("applies custom field name when specified", () => {
      const toDate = "2022-11-10T14:44:08.000Z";
      const result = buildDateFilter(null, toDate, "custom");
      expect(result).toEqual({
        custom: LessThanOrEqual(new Date(toDate)),
      });
    });
  });

  describe("paginate", () => {
    const totalCount = 100;
    let queryBuilder: SelectQueryBuilder<BaseEntity>;
    let countSubQueryBuilder: SelectQueryBuilder<BaseEntity>;
    let countMainQueryBuilder: SelectQueryBuilder<BaseEntity>;
    let options: IPaginationOptions;

    beforeEach(() => {
      countMainQueryBuilder = mock<SelectQueryBuilder<BaseEntity>>();
      countSubQueryBuilder = mock<SelectQueryBuilder<BaseEntity>>();
      queryBuilder = mock<SelectQueryBuilder<BaseEntity>>({
        connection: {
          createQueryBuilder: jest.fn().mockReturnValue(countMainQueryBuilder),
        },
        andWhere: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      });

      options = {
        page: 1,
        limit: 10,
        filterOptions: {},
      };

      (queryBuilder.clone as jest.Mock).mockReturnValue(countSubQueryBuilder);
      (countMainQueryBuilder.getRawOne as jest.Mock).mockReturnValue({ value: totalCount.toString() });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("sets items query limit to the limit specified in the options", async () => {
      await paginate(queryBuilder, options);
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it("sets items query the offset based on the specified options", async () => {
      options.page = 3;
      await paginate(queryBuilder, options);
      expect(queryBuilder.offset).toHaveBeenCalledWith(20);
    });

    it("sets count sub query select setting to true", async () => {
      await paginate(queryBuilder, options);
      expect(countSubQueryBuilder.select).toHaveBeenCalledWith("true");
    });

    it("resets count sub query skip setting", async () => {
      await paginate(queryBuilder, options);
      expect(countSubQueryBuilder.skip).toHaveBeenCalledWith(undefined);
    });

    it("resets count sub query limit setting if there is not maxLimit specified", async () => {
      delete options.maxLimit;
      await paginate(queryBuilder, options);
      expect(countSubQueryBuilder.limit).toHaveBeenCalledWith(undefined);
    });

    it("sets count sub query limit setting if maxLimit is specified", async () => {
      options.maxLimit = 40;
      await paginate(queryBuilder, options);
      expect(countSubQueryBuilder.limit).toHaveBeenCalledWith(40);
    });

    it("resets count sub query offset setting", async () => {
      await paginate(queryBuilder, options);
      expect(countSubQueryBuilder.offset).toHaveBeenCalledWith(undefined);
    });

    it("resets count sub query take setting", async () => {
      await paginate(queryBuilder, options);
      expect(countSubQueryBuilder.take).toHaveBeenCalledWith(undefined);
    });

    it("sets count main query select statement", async () => {
      await paginate(queryBuilder, options);
      expect(countMainQueryBuilder.select).toHaveBeenCalledWith("COUNT(*)", "value");
    });

    it("injects count sub query to the count main query", async () => {
      const subQuerySql = "subQuerySql";
      (countSubQueryBuilder.getQuery as jest.Mock).mockReturnValue(subQuerySql);
      await paginate(queryBuilder, options);
      expect(countMainQueryBuilder.from).toHaveBeenCalledWith(`(${subQuerySql})`, "uniqueTableAlias");
    });

    it("sets count main query parameters", async () => {
      const parameters = ["value1", "value2"];
      (queryBuilder.getParameters as jest.Mock).mockReturnValue(parameters);
      await paginate(queryBuilder, options);
      expect(countMainQueryBuilder.setParameters).toHaveBeenCalledWith(parameters);
    });

    it("queries items count", async () => {
      await paginate(queryBuilder, options);
      expect(countMainQueryBuilder.getRawOne).toHaveBeenCalledWith();
    });

    it("creates pagination object and returns paginated result", async () => {
      const items = [{ id: 1 }, { id: 2 }];
      options.route = "/entityName";

      const paginatedResultMock = mock<paginator.Pagination<BaseEntity>>();

      (paginator.createPaginationObject as jest.Mock).mockResolvedValue(paginatedResultMock);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(items);

      const result = await paginate(queryBuilder, options);
      expect(paginator.createPaginationObject).toBeCalledWith({
        items,
        totalItems: totalCount,
        currentPage: options.page,
        limit: options.limit,
        route: options.route,
      });
      expect(result).toBe(paginatedResultMock);
    });

    it("updates pagination meta links", async () => {
      const paginatedResultMock = {
        links: {
          first: "?page=1&limit=2",
          last: "?page=2&limit=2",
          previous: "",
        },
      };
      (paginator.createPaginationObject as jest.Mock).mockResolvedValue(paginatedResultMock);

      options.filterOptions = {
        fromDate: "fromDate",
        toDate: null,
      };

      const result = await paginate(queryBuilder, options);
      expect(result.links).toEqual({
        first: "?page=1&limit=2&fromDate=fromDate",
        last: "?page=2&limit=2&fromDate=fromDate",
        previous: "",
      });
    });

    it("does not edit pagination meta links if no filter options specified", async () => {
      const paginatedResultMock = {
        links: {
          first: "?page=1&limit=2",
          last: "?page=2&limit=2",
          previous: "",
        },
      };
      (paginator.createPaginationObject as jest.Mock).mockResolvedValue(paginatedResultMock);
      delete options.filterOptions;

      const result = await paginate(queryBuilder, options);
      expect(result.links).toEqual({
        first: "?page=1&limit=2",
        last: "?page=2&limit=2",
        previous: "",
      });
    });

    describe("when custom count query is specified", () => {
      it("creates pagination object and returns paginated result with count from custom query", async () => {
        const items = [{ id: 1 }, { id: 2 }];
        options.route = "/entityName";

        const paginatedResultMock = mock<paginator.Pagination<BaseEntity>>();

        (paginator.createPaginationObject as jest.Mock).mockResolvedValue(paginatedResultMock);
        (queryBuilder.getMany as jest.Mock).mockResolvedValue(items);

        const totalCount = 70;
        const result = await paginate(queryBuilder, options, async () => totalCount);
        expect(paginator.createPaginationObject).toBeCalledWith({
          items,
          totalItems: totalCount,
          currentPage: options.page,
          limit: options.limit,
          route: options.route,
        });
        expect(result).toBe(paginatedResultMock);
      });
    });

    describe("when options.canUseNumberFilterAsOffset is set to true", () => {
      describe("and offset is greater than 1000", () => {
        it("uses filter by number instead of offset", async () => {
          const clonedQueryBuilder = {
            limit: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({ number: 3000 }),
          };
          (queryBuilder.clone as jest.Mock).mockReturnValueOnce(clonedQueryBuilder);

          await paginate(
            queryBuilder,
            {
              ...options,
              page: 101,
              canUseNumberFilterAsOffset: true,
            },
            async () => 10000
          );

          expect(clonedQueryBuilder.limit).toBeCalledWith(1);
          expect(clonedQueryBuilder.getOne).toBeCalledTimes(1);
          expect(queryBuilder.andWhere).toBeCalledWith({
            number: LessThanOrEqual(2000),
          });
          expect(queryBuilder.offset).toBeCalledWith(0);
          expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
        });

        it("sets negative number filter when there are no items for a given page", async () => {
          const clonedQueryBuilder = {
            limit: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({ number: 3000 }),
          };
          (queryBuilder.clone as jest.Mock).mockReturnValueOnce(clonedQueryBuilder);

          await paginate(
            queryBuilder,
            {
              ...options,
              page: 401,
              canUseNumberFilterAsOffset: true,
            },
            async () => 10000
          );

          expect(clonedQueryBuilder.limit).toBeCalledWith(1);
          expect(clonedQueryBuilder.getOne).toBeCalledTimes(1);
          expect(queryBuilder.andWhere).toBeCalledWith({
            number: LessThanOrEqual(-1000),
          });
          expect(queryBuilder.offset).toBeCalledWith(0);
          expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
        });

        it("sets negative number filter when there are no items for a given filter", async () => {
          const clonedQueryBuilder = {
            limit: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          };
          (queryBuilder.clone as jest.Mock).mockReturnValueOnce(clonedQueryBuilder);

          await paginate(
            queryBuilder,
            {
              ...options,
              page: 101,
              canUseNumberFilterAsOffset: true,
            },
            async () => 10000
          );

          expect(clonedQueryBuilder.limit).toBeCalledWith(1);
          expect(clonedQueryBuilder.getOne).toBeCalledTimes(1);
          expect(queryBuilder.andWhere).toBeCalledWith({
            number: LessThanOrEqual(-1001),
          });
          expect(queryBuilder.offset).toBeCalledWith(0);
          expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
        });
      });

      describe("and offset is smaller than 1000", () => {
        it("does not use filter by number instead of offset", async () => {
          const clonedQueryBuilder = {
            limit: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({ number: 3000 }),
          };
          (queryBuilder.clone as jest.Mock).mockReturnValueOnce(clonedQueryBuilder);

          await paginate(
            queryBuilder,
            {
              ...options,
              page: 100,
              canUseNumberFilterAsOffset: true,
            },
            async () => 10000
          );

          expect(clonedQueryBuilder.limit).not.toBeCalled();
          expect(clonedQueryBuilder.getOne).not.toBeCalled();
          expect(queryBuilder.andWhere).not.toBeCalled();
          expect(queryBuilder.offset).toBeCalledWith(990);
          expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
        });
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
});
