import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { BalanceService } from "./balance.service";
import { Balance } from "./balance.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import * as utils from "../common/utils";
import { IPaginationMeta, Pagination } from "nestjs-typeorm-paginate";
jest.mock("../common/utils");

describe("BalanceService", () => {
  let service: BalanceService;
  let repositoryMock: Repository<Balance>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Balance>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: getRepositoryToken(Balance),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getBalances", () => {
    let subQueryBuilderMock;
    let mainQueryBuilderMock;
    const address = "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67";
    const subQuerySql = "subQuerySql";

    beforeEach(() => {
      subQueryBuilderMock = mock<SelectQueryBuilder<Balance>>({
        getQuery: jest.fn().mockReturnValue(subQuerySql),
      });

      mainQueryBuilderMock = mock<SelectQueryBuilder<Balance>>({
        getMany: jest.fn().mockReturnValue([]),
      });

      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(subQueryBuilderMock);
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(mainQueryBuilderMock);
    });

    it("creates sub query builder with proper params", async () => {
      await service.getBalances(address);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("latest_balances");
    });

    it("selects required fields in the sub query", async () => {
      await service.getBalances(address);
      expect(subQueryBuilderMock.select).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.select).toHaveBeenCalledWith("address");
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledTimes(2);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`"tokenAddress"`);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`MAX("blockNumber")`, "blockNumber");
    });

    it("filters balances in the sub query", async () => {
      await service.getBalances(address);
      expect(subQueryBuilderMock.where).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.where).toHaveBeenCalledWith("address = :address");
    });

    it("groups by balances in the sub query", async () => {
      await service.getBalances(address);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledWith("address");
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledWith(`"tokenAddress"`);
    });

    it("creates main query builder with proper params", async () => {
      await service.getBalances(address);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("balances");
    });

    it("joins main query with the sub query", async () => {
      await service.getBalances(address);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        `(${subQuerySql})`,
        "latest_balances",
        `balances.address = latest_balances.address AND
      balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."blockNumber" = latest_balances."blockNumber"`
      );
    });

    it("sets query address params", async () => {
      await service.getBalances(address);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledWith("address", hexTransformer.to(address));
    });

    it("joins token entity", async () => {
      await service.getBalances(address);
      expect(mainQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("balances.token", "token");
    });

    it("gets main query results", async () => {
      await service.getBalances(address);
      expect(mainQueryBuilderMock.getMany).toHaveBeenCalledTimes(1);
    });

    describe("when there are no balances", () => {
      beforeEach(() => {
        (mainQueryBuilderMock.getMany as jest.Mock).mockResolvedValue([]);
      });

      it("returns result with zero block number", async () => {
        const result = await service.getBalances(address);
        expect(result.blockNumber).toBe(0);
      });

      it("returns result with empty balances", async () => {
        const result = await service.getBalances(address);
        expect(result.balances).toStrictEqual({});
      });
    });

    describe("when there are balances", () => {
      let balances: Balance[];
      const tokens = [
        {
          l2Address: "tokenAddress0",
          symbol: "token 0",
        },
        {
          l2Address: "tokenAddress1",
          symbol: "token 1",
        },
        {
          l2Address: "tokenAddress2",
          symbol: "token 2",
        },
      ];

      beforeEach(() => {
        balances = [
          mock<Balance>({
            tokenAddress: "tokenAddress0",
            blockNumber: 10,
            balance: "10",
            token: tokens[0],
          }),
          mock<Balance>({
            tokenAddress: "tokenAddress1",
            blockNumber: 30,
            balance: "30",
            token: tokens[1],
          }),
          mock<Balance>({
            tokenAddress: "tokenAddress2",
            blockNumber: 20,
            balance: "20",
            token: tokens[2],
          }),
        ];
        (mainQueryBuilderMock.getMany as jest.Mock).mockResolvedValue(balances);
      });

      it("returns result with block number equals to max block number in balances", async () => {
        const result = await service.getBalances(address);
        expect(result.blockNumber).toBe(30);
      });

      it("returns result with address balances", async () => {
        const result = await service.getBalances(address);
        expect(result.balances).toStrictEqual({
          tokenAddress0: {
            balance: "10",
            token: tokens[0],
          },
          tokenAddress1: {
            balance: "30",
            token: tokens[1],
          },
          tokenAddress2: {
            balance: "20",
            token: tokens[2],
          },
        });
      });
    });
  });

  describe("getBalance", () => {
    it("returns 0 when no balance record found by address and token address", async () => {
      jest.spyOn(repositoryMock, "findOne").mockResolvedValue(null);
      const balance = await service.getBalance("address", "token");
      expect(balance).toBe("0");
    });

    it("returns token balance for address when balance record is found by address and token address", async () => {
      jest.spyOn(repositoryMock, "findOne").mockResolvedValue({
        balance: "1000",
      } as Balance);
      const balance = await service.getBalance("address", "token");
      expect(balance).toBe("1000");
    });
  });

  describe("getBalancesByAddresses", () => {
    let subQueryBuilderMock;
    let mainQueryBuilderMock;
    const addresses = ["0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67", "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68"];
    const tokenAddress = "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69";
    const subQuerySql = "subQuerySql";

    beforeEach(() => {
      subQueryBuilderMock = mock<SelectQueryBuilder<Balance>>({
        getQuery: jest.fn().mockReturnValue(subQuerySql),
      });

      mainQueryBuilderMock = mock<SelectQueryBuilder<Balance>>({
        getMany: jest.fn().mockReturnValue([]),
      });

      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(subQueryBuilderMock);
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(mainQueryBuilderMock);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("creates sub query builder with proper params", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("latest_balances");
    });

    it("selects required fields in the sub query", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(subQueryBuilderMock.select).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.select).toHaveBeenCalledWith("address");
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledTimes(2);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`"tokenAddress"`);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`MAX("blockNumber")`, "blockNumber");
    });

    it("filters balances in the sub query", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(subQueryBuilderMock.where).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.where).toHaveBeenCalledWith(`"tokenAddress" = :tokenAddress`);
      expect(subQueryBuilderMock.andWhere).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.andWhere).toHaveBeenCalledWith("address IN(:...addresses)");
    });

    it("groups by address and tokenAddress in the sub query", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledWith("address");
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledWith(`"tokenAddress"`);
    });

    it("creates main query builder with proper params", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("balances");
    });

    it("selects required fields in the main query", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(mainQueryBuilderMock.select).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.select).toHaveBeenCalledWith("balances.address");
      expect(mainQueryBuilderMock.addSelect).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.addSelect).toHaveBeenCalledWith("balances.balance");
    });

    it("joins main query with the sub query", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        `(${subQuerySql})`,
        "latest_balances",
        `balances.address = latest_balances.address AND
      balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."blockNumber" = latest_balances."blockNumber"`
      );
    });

    it("sets query tokenAddress and addresses params", async () => {
      await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledTimes(2);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledWith("tokenAddress", hexTransformer.to(tokenAddress));
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledWith(
        "addresses",
        addresses.map((address) => hexTransformer.to(address))
      );
    });

    it("returns main query results", async () => {
      const result = await service.getBalancesByAddresses(addresses, tokenAddress);
      expect(mainQueryBuilderMock.getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe("getBalancesForTokenAddress", () => {
    const subQuerySql = "subQuerySql";
    const tokenAddress = "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69";
    let subQueryBuilderMock;
    let mainQueryBuilderMock;
    const pagingOptions = {
      limit: 10,
      page: 2,
    };
    beforeEach(() => {
      subQueryBuilderMock = mock<SelectQueryBuilder<Balance>>({
        getQuery: jest.fn().mockReturnValue(subQuerySql),
      });
      mainQueryBuilderMock = mock<SelectQueryBuilder<Balance>>();
      (utils.paginate as jest.Mock).mockResolvedValue({
        items: [],
      });
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(subQueryBuilderMock);
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(mainQueryBuilderMock);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("creates sub query builder with proper params", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("latest_balances");
    });

    it("selects required fields in the sub query", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(subQueryBuilderMock.select).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.select).toHaveBeenCalledWith(`"tokenAddress"`);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledTimes(2);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`"address"`);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`MAX("blockNumber")`, "blockNumber");
    });

    it("filters balances in the sub query", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(subQueryBuilderMock.where).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.where).toHaveBeenCalledWith(`"tokenAddress" = :tokenAddress`);
    });

    it("groups by address and tokenAddress in the sub query", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledWith(`"tokenAddress"`);
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledWith(`"address"`);
    });

    it("creates main query builder with proper params", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("balances");
    });

    it("joins main query with the sub query", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        `(${subQuerySql})`,
        "latest_balances",
        `balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."address" = latest_balances."address" AND
      balances."blockNumber" = latest_balances."blockNumber"`
      );
    });

    it("sets query tokenAddress and addresses params", async () => {
      await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledWith("tokenAddress", hexTransformer.to(tokenAddress));
    });

    it("returns pagination results", async () => {
      const balances = [
        mock<Balance>({ balance: "2222", address: "0x111111" }),
        mock<Balance>({ balance: "3333", address: "0x222222" }),
      ];
      const paginationResult = mock<Pagination<Balance, IPaginationMeta>>({
        meta: {
          totalItems: 2,
          itemCount: 2,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
        links: {
          first: "first",
          previous: "previous",
          next: "next",
          last: "last",
        },
        items: [balances[0], balances[1]],
      });
      (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      const result = await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(utils.paginate).toHaveBeenCalledTimes(1);
      expect(utils.paginate).toHaveBeenCalledWith(mainQueryBuilderMock, pagingOptions);
      expect(result).toStrictEqual({
        ...paginationResult,
        items: [
          { balance: balances[0].balance, address: balances[0].address },
          { balance: balances[1].balance, address: balances[1].address },
        ],
      });
    });

    it("returns empty pagination results", async () => {
      const paginationResult = mock<Pagination<Balance, IPaginationMeta>>({
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
        items: [],
      });
      (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      const result = await service.getBalancesForTokenAddress(tokenAddress, pagingOptions);
      expect(utils.paginate).toHaveBeenCalledTimes(1);
      expect(utils.paginate).toHaveBeenCalledWith(mainQueryBuilderMock, pagingOptions);
      expect(result).toStrictEqual({ ...paginationResult, items: [] });
    });
  });

  describe("getSumAndCountBalances", () => {
    const subQuerySql = "subQuerySql";
    const tokenAddress = "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69";
    let subQueryBuilderMock;
    let mainQueryBuilderMock;

    beforeEach(() => {
      subQueryBuilderMock = mock<SelectQueryBuilder<Balance>>({
        getQuery: jest.fn().mockReturnValue(subQuerySql),
      });
      mainQueryBuilderMock = mock<SelectQueryBuilder<Balance>>();
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(subQueryBuilderMock);
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValueOnce(mainQueryBuilderMock);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("creates sub query builder with proper params", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("latest_balances");
    });

    it("selects required fields in the sub query", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(subQueryBuilderMock.select).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.select).toHaveBeenCalledWith(`"tokenAddress"`);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledTimes(2);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`"address"`);
      expect(subQueryBuilderMock.addSelect).toHaveBeenCalledWith(`MAX("blockNumber")`, "blockNumber");
    });

    it("filters balances in the sub query", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(subQueryBuilderMock.where).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.where).toHaveBeenCalledWith(`"tokenAddress" = :tokenAddress`);
    });

    it("groups by address and tokenAddress in the sub query", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.groupBy).toHaveBeenCalledWith(`"tokenAddress"`);
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledTimes(1);
      expect(subQueryBuilderMock.addGroupBy).toHaveBeenCalledWith(`"address"`);
    });

    it("creates main query builder with proper params", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("balances");
    });

    it("joins main query with the sub query", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.innerJoin).toHaveBeenCalledWith(
        `(${subQuerySql})`,
        "latest_balances",
        `balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."address" = latest_balances."address" AND
      balances."blockNumber" = latest_balances."blockNumber"`
      );
    });

    it("sets query tokenAddress param", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledWith("tokenAddress", hexTransformer.to(tokenAddress));
    });

    it("select count and sum", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(mainQueryBuilderMock.addSelect).toHaveBeenCalledTimes(2);
      expect(mainQueryBuilderMock.addSelect).toHaveBeenNthCalledWith(
        1,
        "SUM(CAST(balances.balance AS NUMERIC))",
        "totalBalance"
      );
      expect(mainQueryBuilderMock.addSelect).toHaveBeenNthCalledWith(2, "COUNT(balances.address)", "totalCount");
    });

    it("sets query tokenAddress param", async () => {
      await service.getSumAndCountBalances(tokenAddress);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledTimes(1);
      expect(mainQueryBuilderMock.setParameter).toHaveBeenCalledWith("tokenAddress", hexTransformer.to(tokenAddress));
    });

    it("returns results", async () => {
      mainQueryBuilderMock.getRawOne = jest.fn().mockResolvedValue({
        totalBalance: 1000,
        totalCount: 2,
      });
      const result = await service.getSumAndCountBalances(tokenAddress);
      expect(result).toStrictEqual({
        holders: 2,
        maxTotalSupply: 1000,
      });
    });

    it("returns empty results", async () => {
      const result = await service.getSumAndCountBalances(tokenAddress);
      expect(result).toStrictEqual({
        holders: 0,
        maxTotalSupply: 0,
      });
    });
  });
});
