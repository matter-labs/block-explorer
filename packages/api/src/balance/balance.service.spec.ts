import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { BalanceService } from "./balance.service";
import { Balance } from "./balance.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";

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
});
