import { Test, TestingModule } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { InternalTransactionRepository } from "./internalTransaction.repository";
import { UnitOfWork } from "../unitOfWork";
import { AddressInternalTransactionRepository } from "./addressInternalTransaction.repository";
import { InternalTransaction } from "../entities";

describe("InternalTransactionRepository", () => {
  let repository: InternalTransactionRepository;
  let entityManagerMock: EntityManager;
  let unitOfWorkMock: UnitOfWork;
  let addressInternalTransactionRepositoryMock: AddressInternalTransactionRepository;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });
    addressInternalTransactionRepositoryMock = mock<AddressInternalTransactionRepository>({
      addMany: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalTransactionRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: AddressInternalTransactionRepository,
          useValue: addressInternalTransactionRepositoryMock,
        },
      ],
    }).compile();

    repository = module.get<InternalTransactionRepository>(InternalTransactionRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("add", () => {
    it("adds an internal transaction and denormalizes from/to addresses", async () => {
      const record = {
        transactionHash: "0xhash",
        traceAddress: "0x0",
        blockNumber: 1,
        timestamp: "2024-01-01T00:00:00Z",
        traceIndex: 0,
        from: "0xfrom",
        to: "0xto",
      };

      await repository.add(record);

      expect(entityManagerMock.insert).toHaveBeenCalledWith(InternalTransaction, record);
      expect(addressInternalTransactionRepositoryMock.addMany).toHaveBeenCalledWith([
        {
          transactionHash: record.transactionHash,
          traceAddress: record.traceAddress,
          blockNumber: record.blockNumber,
          timestamp: record.timestamp,
          traceIndex: record.traceIndex,
          address: record.from,
        },
        {
          transactionHash: record.transactionHash,
          traceAddress: record.traceAddress,
          blockNumber: record.blockNumber,
          timestamp: record.timestamp,
          traceIndex: record.traceIndex,
          address: record.to,
        },
      ]);
    });
  });

  describe("addMany", () => {
    it("adds records and avoids duplicating address entries when to matches from", async () => {
      const records = [
        {
          transactionHash: "0xhash1",
          traceAddress: "0x0",
          blockNumber: 1,
          timestamp: "2024-01-01T00:00:00Z",
          traceIndex: 0,
          from: "0xsame",
          to: "0xsame",
        },
        {
          transactionHash: "0xhash2",
          traceAddress: "0x1",
          blockNumber: 2,
          timestamp: "2024-01-02T00:00:00Z",
          traceIndex: 1,
          from: "0xfrom2",
          to: "0xto2",
        },
      ];

      await repository.addMany(records);

      expect(entityManagerMock.insert).toHaveBeenCalledTimes(1);
      expect(entityManagerMock.insert).toHaveBeenCalledWith(InternalTransaction, records);
      expect(addressInternalTransactionRepositoryMock.addMany).toHaveBeenCalledWith([
        {
          transactionHash: records[0].transactionHash,
          traceAddress: records[0].traceAddress,
          blockNumber: records[0].blockNumber,
          timestamp: records[0].timestamp,
          traceIndex: records[0].traceIndex,
          address: records[0].from,
        },
        {
          transactionHash: records[1].transactionHash,
          traceAddress: records[1].traceAddress,
          blockNumber: records[1].blockNumber,
          timestamp: records[1].timestamp,
          traceIndex: records[1].traceIndex,
          address: records[1].from,
        },
        {
          transactionHash: records[1].transactionHash,
          traceAddress: records[1].traceAddress,
          blockNumber: records[1].blockNumber,
          timestamp: records[1].timestamp,
          traceIndex: records[1].traceIndex,
          address: records[1].to,
        },
      ]);
    });

    it("skips adding address records when none are present", async () => {
      const records = [
        {
          transactionHash: "0xhash3",
          traceAddress: "0x2",
          blockNumber: 3,
          timestamp: "2024-01-03T00:00:00Z",
          traceIndex: 2,
        },
      ];

      await repository.addMany(records);

      expect(entityManagerMock.insert).toHaveBeenCalledWith(InternalTransaction, records);
      expect(addressInternalTransactionRepositoryMock.addMany).not.toHaveBeenCalled();
    });
  });
});
