import { Test, TestingModuleBuilder } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { BalanceRepository } from "../repositories";
import { TokenType } from "../entities";
import { Balance as ChangedBalance } from "../dataFetcher/types";
import { BalanceService } from "./";

describe("BalanceService", () => {
  let testingModuleBuilder: TestingModuleBuilder;
  let balanceRepositoryMock: BalanceRepository;
  let balanceService: BalanceService;

  let startDeleteOldBalancesDurationMetricMock: jest.Mock;
  let stopDeleteOldBalancesDurationMetricMock: jest.Mock;
  let startDeleteZeroBalancesDurationMetricMock: jest.Mock;
  let stopDeleteZeroBalancesDurationMetricMock: jest.Mock;

  beforeEach(async () => {
    balanceRepositoryMock = mock<BalanceRepository>({
      deleteOldBalances: jest.fn().mockResolvedValue(null),
    });

    stopDeleteOldBalancesDurationMetricMock = jest.fn();
    startDeleteOldBalancesDurationMetricMock = jest.fn().mockReturnValue(stopDeleteOldBalancesDurationMetricMock);
    stopDeleteZeroBalancesDurationMetricMock = jest.fn();
    startDeleteZeroBalancesDurationMetricMock = jest.fn().mockReturnValue(stopDeleteZeroBalancesDurationMetricMock);

    testingModuleBuilder = Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BalanceRepository,
          useValue: balanceRepositoryMock,
        },
        {
          provide: "PROM_METRIC_DELETE_OLD_BALANCES_DURATION_SECONDS",
          useValue: {
            startTimer: startDeleteOldBalancesDurationMetricMock,
          },
        },
        {
          provide: "PROM_METRIC_DELETE_ZERO_BALANCES_DURATION_SECONDS",
          useValue: {
            startTimer: startDeleteZeroBalancesDurationMetricMock,
          },
        },
      ],
    });
    const app = await testingModuleBuilder.compile();

    app.useLogger(mock<Logger>());

    balanceService = app.get<BalanceService>(BalanceService);
  });

  describe("saveChangedBalances", () => {
    const changesBalances = [
      { address: "address1", tokenAddress: "tokenAddresses1", balance: "100" } as ChangedBalance,
      { address: "address2", tokenAddress: "tokenAddresses2", balance: "200" } as ChangedBalance,
    ];

    it("saves changes balances to the DB", async () => {
      await balanceService.saveChangedBalances(changesBalances);
      expect(balanceRepositoryMock.addMany).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.addMany).toHaveBeenCalledWith(changesBalances);
    });
  });

  describe("getERC20TokensForChangedBalances", () => {
    const changesBalances = [
      {
        address: "address1",
        tokenAddress: "tokenAddresses1",
        balance: "100",
        tokenType: TokenType.ERC20,
      } as ChangedBalance,
      {
        address: "address2",
        tokenAddress: "tokenAddresses2",
        balance: "200",
        tokenType: TokenType.ERC20,
      } as ChangedBalance,
      {
        address: "address3",
        tokenAddress: "tokenAddresses1",
        balance: "300",
        tokenType: TokenType.ERC20,
      } as ChangedBalance,
      {
        address: "address4",
        tokenAddress: "tokenAddresses3",
        balance: "400",
        tokenType: TokenType.ETH,
      } as ChangedBalance,
    ];

    it("returns empty array if there are no changed balances", () => {
      expect(balanceService.getERC20TokensForChangedBalances([])).toEqual([]);
    });

    it("returns unique ERC20 tokens addresses array for changed balances", async () => {
      expect(balanceService.getERC20TokensForChangedBalances(changesBalances)).toEqual([
        "tokenAddresses1",
        "tokenAddresses2",
      ]);
    });
  });

  describe("deleteOldBalances", () => {
    const fromBlockNumber = 10;
    const toBlockNumber = 10;
    it("starts delete old balances metric timer", async () => {
      await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
      expect(startDeleteOldBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("calls repository to delete old balances", async () => {
      await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
      expect(balanceRepositoryMock.deleteOldBalances).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.deleteOldBalances).toHaveBeenCalledWith(fromBlockNumber, toBlockNumber);
    });

    describe("when repository call succeeds", () => {
      it("stops delete old balances metric timer", async () => {
        await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteOldBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when repository call fails", () => {
      it("stops delete old balances metric timer", async () => {
        (balanceRepositoryMock.deleteOldBalances as jest.Mock).mockRejectedValueOnce(new Error("error"));

        await balanceService.deleteOldBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteOldBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("deleteZeroBalances", () => {
    const fromBlockNumber = 10;
    const toBlockNumber = 10;
    it("starts delete zero balances metric timer", async () => {
      await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
      expect(startDeleteZeroBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("calls repository to delete zero balances", async () => {
      await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
      expect(balanceRepositoryMock.deleteZeroBalances).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.deleteZeroBalances).toHaveBeenCalledWith(fromBlockNumber, toBlockNumber);
    });

    describe("when repository call succeeds", () => {
      it("stops delete zero balances metric timer", async () => {
        await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteZeroBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when repository call fails", () => {
      it("stops delete zero balances metric timer", async () => {
        (balanceRepositoryMock.deleteZeroBalances as jest.Mock).mockRejectedValueOnce(new Error("error"));

        await balanceService.deleteZeroBalances(fromBlockNumber, toBlockNumber);
        expect(stopDeleteZeroBalancesDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("getDeleteBalancesFromBlockNumber", () => {
    beforeEach(() => {
      (balanceRepositoryMock.getDeleteBalancesFromBlockNumber as jest.Mock).mockResolvedValue(10);
    });

    it("returns getDeleteBalancesFromBlockNumber value from the repository", async () => {
      const result = await balanceService.getDeleteBalancesFromBlockNumber();
      expect(result).toBe(10);
    });
  });

  describe("setDeleteBalancesFromBlockNumber", () => {
    it("sets fromBlockNumber for deleteBalance service", async () => {
      await balanceService.setDeleteBalancesFromBlockNumber(10);
      expect(balanceRepositoryMock.setDeleteBalancesFromBlockNumber).toHaveBeenCalledTimes(1);
      expect(balanceRepositoryMock.setDeleteBalancesFromBlockNumber).toHaveBeenCalledWith(10);
    });
  });
});
