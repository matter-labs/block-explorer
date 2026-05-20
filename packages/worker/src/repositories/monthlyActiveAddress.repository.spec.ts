import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { UnitOfWork } from "../unitOfWork";
import { MonthlyActiveAddressRepository } from "./monthlyActiveAddress.repository";

describe("MonthlyActiveAddressRepository", () => {
  let repository: MonthlyActiveAddressRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>({
      query: jest.fn().mockResolvedValue([{ processed: 0, newLastBlockNumber: null, newLastRecordNumber: null }]),
    });
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        MonthlyActiveAddressRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<MonthlyActiveAddressRepository>(MonthlyActiveAddressRepository);
  });

  describe("processTransactionsBatch", () => {
    it("calls query with the cursor / readiness / batch limit / tableName params and returns the parsed counts", async () => {
      (entityManagerMock.query as jest.Mock).mockResolvedValueOnce([
        { processed: "5", newLastBlockNumber: "200", newLastRecordNumber: "1234" },
      ]);

      const result = await repository.processTransactionsBatch(
        { lastBlockNumber: 99, lastRecordNumber: 42 },
        1_000_000,
        20_000,
        "monthlyActiveAddresses"
      );

      expect(entityManagerMock.query).toHaveBeenCalledTimes(1);
      const [, params] = (entityManagerMock.query as jest.Mock).mock.calls[0];
      expect(params).toEqual([99, 42, 1_000_000, 20_000, "monthlyActiveAddresses"]);
      expect(result).toEqual({ processed: 5, newLastBlockNumber: 200, newLastRecordNumber: 1234 });
    });
  });

  describe("revertAboveBlockNumber", () => {
    it("calls query with the lastCorrectBlockNumber and tableName params", async () => {
      await repository.revertAboveBlockNumber(150, "monthlyActiveAddresses");
      expect(entityManagerMock.query).toHaveBeenCalledTimes(1);
      const [, params] = (entityManagerMock.query as jest.Mock).mock.calls[0];
      expect(params).toEqual([150, "monthlyActiveAddresses"]);
    });
  });
});
