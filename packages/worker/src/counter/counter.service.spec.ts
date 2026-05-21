import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { CounterRepository } from "../repositories";
import { CounterWorker } from "./counter.worker";
import { MonthlyActiveAddressCounterWorker } from "./monthlyActiveAddressCounter.worker";
import { Transaction, Transfer } from "../entities";
import { CounterService } from "./";

jest.mock("./counter.worker");
jest.mock("./counter.processor");
jest.mock("./monthlyActiveAddressCounter.worker");

describe("CounterService", () => {
  let counterRepositoryMock: CounterRepository;
  let transactionCounterWorkerMock: CounterWorker<Transaction>;
  let transferCounterWorkerMock: CounterWorker<Transfer>;
  let monthlyActiveAddressCounterWorkerMock: MonthlyActiveAddressCounterWorker;
  let configServiceMock: ConfigService;
  let counterService: CounterService;

  const createApp = () =>
    Test.createTestingModule({
      providers: [
        CounterService,
        {
          provide: CounterRepository,
          useValue: counterRepositoryMock,
        },
        {
          provide: "CounterWorker<Transaction>",
          useValue: transactionCounterWorkerMock,
        },
        {
          provide: "CounterWorker<Transfer>",
          useValue: transferCounterWorkerMock,
        },
        {
          provide: MonthlyActiveAddressCounterWorker,
          useValue: monthlyActiveAddressCounterWorkerMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

  beforeEach(async () => {
    counterRepositoryMock = mock<CounterRepository>({
      delete: jest.fn().mockResolvedValue(null),
    });
    transactionCounterWorkerMock = mock<CounterWorker<Transaction>>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn(),
    });
    transferCounterWorkerMock = mock<CounterWorker<Transfer>>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn(),
    });
    monthlyActiveAddressCounterWorkerMock = mock<MonthlyActiveAddressCounterWorker>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn().mockResolvedValue(null),
      revert: jest.fn().mockResolvedValue(null),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });

    const app = await createApp();

    counterService = app.get(CounterService);
  });

  describe("start", () => {
    it("starts all the injected workers", async () => {
      await counterService.start();

      expect(transactionCounterWorkerMock.start).toHaveBeenCalledTimes(1);
      expect(transferCounterWorkerMock.start).toHaveBeenCalledTimes(1);
      expect(monthlyActiveAddressCounterWorkerMock.start).toHaveBeenCalledTimes(1);
    });

    it("does not start the monthly active address worker when disabled", async () => {
      (configServiceMock.get as jest.Mock).mockReturnValueOnce(true);
      counterService = (await createApp()).get(CounterService);

      await counterService.start();
      expect(monthlyActiveAddressCounterWorkerMock.start).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("stops all the injected workers", async () => {
      await counterService.stop();

      expect(transactionCounterWorkerMock.stop).toHaveBeenCalledTimes(1);
      expect(transferCounterWorkerMock.stop).toHaveBeenCalledTimes(1);
      expect(monthlyActiveAddressCounterWorkerMock.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("revert", () => {
    it("calls revert on all the injected workers", async () => {
      await counterService.revert(100);

      expect(transactionCounterWorkerMock.revert).toHaveBeenCalledWith(100);
      expect(transferCounterWorkerMock.revert).toHaveBeenCalledWith(100);
      expect(monthlyActiveAddressCounterWorkerMock.revert).toHaveBeenCalledWith(100);
    });

    it("deletes counters with 0 count", async () => {
      await counterService.revert(100);
      expect(counterRepositoryMock.delete).toHaveBeenCalledTimes(1);
    });
  });
});
