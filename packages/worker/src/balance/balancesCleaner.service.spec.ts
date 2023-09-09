import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import waitFor from "../utils/waitFor";
import { BalancesCleanerService, BalanceService } from ".";
import { BlockRepository } from "../repositories/block.repository";

jest.mock("../utils/waitFor");

describe("BalancesCleanerService", () => {
  const lastVerifiedBlockNumber = 10;
  let balanceServiceMock: BalanceService;
  let blockRepositoryMock: BlockRepository;
  let balancesCleanerService: BalancesCleanerService;

  beforeEach(() => {
    (waitFor as jest.Mock).mockResolvedValue(null);
    balanceServiceMock = mock<BalanceService>({
      getDeleteBalancesFromBlockNumber: jest.fn().mockResolvedValue(5),
    });
    blockRepositoryMock = mock<BlockRepository>({
      getLastExecutedBlockNumber: jest.fn().mockResolvedValue(lastVerifiedBlockNumber),
    });

    balancesCleanerService = new BalancesCleanerService(
      balanceServiceMock,
      blockRepositoryMock,
      mock<ConfigService>({
        get: jest.fn().mockReturnValue(10000),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("start", () => {
    it("starts balances cleaning processes", async () => {
      balancesCleanerService.start();
      await balancesCleanerService.stop();

      expect(balanceServiceMock.deleteOldBalances).toBeCalledTimes(1);
      expect(balanceServiceMock.deleteZeroBalances).toBeCalledTimes(1);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledTimes(1);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledWith(lastVerifiedBlockNumber);
    });

    it("waits for timeout or worker stoppage when after deletion", async () => {
      balancesCleanerService.start();
      await balancesCleanerService.stop();

      const [conditionPredicate, maxWaitTime] = (waitFor as jest.Mock).mock.calls[0];
      expect(waitFor).toBeCalledTimes(1);
      expect(conditionPredicate()).toBeTruthy();
      expect(maxWaitTime).toBe(10000);
    });

    it("starts the process only once when called multiple times", async () => {
      balancesCleanerService.start();
      balancesCleanerService.start();
      await balancesCleanerService.stop();

      expect(balanceServiceMock.deleteOldBalances).toBeCalledTimes(1);
      expect(balanceServiceMock.deleteZeroBalances).toBeCalledTimes(1);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledTimes(1);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledWith(lastVerifiedBlockNumber);
    });

    it("deletes balances iteratively until stopped", async () => {
      let secondIterationResolve: (value: unknown) => void;
      const secondIterationPromise = new Promise((resolve) => (secondIterationResolve = resolve));
      jest
        .spyOn(balanceServiceMock, "setDeleteBalancesFromBlockNumber")
        .mockResolvedValueOnce(null)
        .mockImplementationOnce(() => {
          secondIterationResolve(null);
          return Promise.resolve(null);
        })
        .mockResolvedValueOnce(null);

      (blockRepositoryMock.getLastExecutedBlockNumber as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(15);

      (balanceServiceMock.getDeleteBalancesFromBlockNumber as jest.Mock)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(12);

      balancesCleanerService.start();

      await secondIterationPromise;
      await balancesCleanerService.stop();

      expect(balanceServiceMock.deleteOldBalances).toBeCalledTimes(2);
      expect(balanceServiceMock.deleteOldBalances).toHaveBeenNthCalledWith(1, 2, 10);
      expect(balanceServiceMock.deleteOldBalances).toHaveBeenNthCalledWith(2, 12, 15);

      expect(balanceServiceMock.deleteZeroBalances).toBeCalledTimes(2);
      expect(balanceServiceMock.deleteZeroBalances).toHaveBeenNthCalledWith(1, 2, 10);
      expect(balanceServiceMock.deleteZeroBalances).toHaveBeenNthCalledWith(2, 12, 15);

      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledTimes(2);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toHaveBeenNthCalledWith(1, 10);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toHaveBeenNthCalledWith(2, 15);
    });
  });

  describe("stop", () => {
    it("stops balances cleaning process", async () => {
      balancesCleanerService.start();
      await balancesCleanerService.stop();

      expect(balanceServiceMock.deleteOldBalances).toBeCalledTimes(1);
      expect(balanceServiceMock.deleteZeroBalances).toBeCalledTimes(1);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledTimes(1);
      expect(balanceServiceMock.setDeleteBalancesFromBlockNumber).toBeCalledWith(lastVerifiedBlockNumber);
    });
  });
});
