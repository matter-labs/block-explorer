import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { InternalTransactionRepository } from "./internalTransaction.repository";
import { UnitOfWork } from "../unitOfWork";
import { InternalTransaction } from "../entities";

describe("InternalTransactionRepository", () => {
  let repository: InternalTransactionRepository;
  let unitOfWorkMock: UnitOfWork;

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalTransactionRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = module.get<InternalTransactionRepository>(InternalTransactionRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("replaceForTransaction", () => {
    let deleteSpy: jest.SpyInstance;
    let addManySpy: jest.SpyInstance;

    beforeEach(() => {
      deleteSpy = jest.spyOn(repository, "delete").mockResolvedValue(undefined);
      addManySpy = jest.spyOn(repository, "addMany").mockResolvedValue(undefined);
    });

    it("should delete existing transactions by hash", async () => {
      const txHash = "0xhash";
      await repository.replaceForTransaction(txHash, []);

      expect(deleteSpy).toHaveBeenCalledWith({ transactionHash: txHash });
    });

    it("should add new records if provided", async () => {
      const txHash = "0xhash";
      const records = [
        { id: "1", transactionHash: txHash } as unknown as InternalTransaction,
        { id: "2", transactionHash: txHash } as unknown as InternalTransaction,
      ];

      await repository.replaceForTransaction(txHash, records);

      expect(deleteSpy).toHaveBeenCalledWith({ transactionHash: txHash });
      expect(addManySpy).toHaveBeenCalledWith(records);
    });

    it("should NOT add records if the list is empty", async () => {
      const txHash = "0xhash";
      await repository.replaceForTransaction(txHash, []);

      expect(deleteSpy).toHaveBeenCalledWith({ transactionHash: txHash });
      expect(addManySpy).not.toHaveBeenCalled();
    });

    it("should NOT add records if the list is undefined", async () => {
      const txHash = "0xhash";
      await repository.replaceForTransaction(txHash, undefined as any);

      expect(deleteSpy).toHaveBeenCalledWith({ transactionHash: txHash });
      expect(addManySpy).not.toHaveBeenCalled();
    });
  });
});
