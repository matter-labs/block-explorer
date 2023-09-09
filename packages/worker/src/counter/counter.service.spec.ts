import { mock } from "jest-mock-extended";
import { Test } from "@nestjs/testing";
import { CounterRepository } from "../repositories";
import { CounterWorker } from "./counter.worker";
import { Transaction, Transfer } from "../entities";
import { CounterService } from "./";

jest.mock("./counter.worker");
jest.mock("./counter.processor");

describe("CounterService", () => {
  let counterRepositoryMock: CounterRepository;
  let transactionCounterWorkerMock: CounterWorker<Transaction>;
  let transferCounterWorkerMock: CounterWorker<Transfer>;
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

    const app = await createApp();

    counterService = app.get(CounterService);
  });

  describe("start", () => {
    it("starts all the injected CounterWorker instances", async () => {
      await counterService.start();

      expect(transactionCounterWorkerMock.start).toHaveBeenCalledTimes(1);
      expect(transferCounterWorkerMock.start).toHaveBeenCalledTimes(1);
    });
  });

  describe("stop", () => {
    it("stops all the injected CounterWorker instances", async () => {
      await counterService.stop();

      expect(transactionCounterWorkerMock.stop).toHaveBeenCalledTimes(1);
      expect(transferCounterWorkerMock.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("revert", () => {
    it("calls revert on all the injected CounterWorker instances", async () => {
      await counterService.revert(100);

      expect(transactionCounterWorkerMock.revert).toHaveBeenCalledTimes(1);
      expect(transferCounterWorkerMock.revert).toHaveBeenCalledTimes(1);
      expect(transactionCounterWorkerMock.revert).toHaveBeenCalledWith(100);
      expect(transferCounterWorkerMock.revert).toHaveBeenCalledWith(100);
    });

    it("deletes counters with 0 count", async () => {
      await counterService.revert(100);
      expect(counterRepositoryMock.delete).toHaveBeenCalledTimes(1);
    });
  });
});
