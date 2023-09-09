import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager } from "typeorm";
import { BaseRepository } from "./base.repository";
import { TransactionRepository } from "./transaction.repository";
import { AddressTransactionRepository } from "./addressTransaction.repository";
import { Transaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("TransactionRepository", () => {
  let repository: TransactionRepository;
  let addressTransactionRepositoryMock: AddressTransactionRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>({
      insert: jest.fn().mockResolvedValue(null),
    });
    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });
    addressTransactionRepositoryMock = mock<AddressTransactionRepository>({
      addMany: jest.fn().mockResolvedValue(null),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: AddressTransactionRepository,
          useValue: addressTransactionRepositoryMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<TransactionRepository>(TransactionRepository);
  });

  it("extends BaseRepository<Transaction>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Transaction>);
  });

  describe("add", () => {
    it("inserts transaction", async () => {
      const record = {
        number: 1,
        hash: "hash",
        from: "from",
        to: "to",
      };
      await repository.add(record);
      expect(entityManagerMock.insert).toBeCalledWith(Transaction, record);
      expect(entityManagerMock.insert).toBeCalledTimes(1);
    });

    it("inserts address transaction for from and to addresses", async () => {
      const record = {
        number: 1,
        hash: "hash",
        from: "from",
        to: "to",
      };
      await repository.add(record);

      expect(addressTransactionRepositoryMock.addMany).toBeCalledWith([
        {
          address: "from",
          from: "from",
          to: "to",
          hash: "hash",
          transactionHash: "hash",
        },
        {
          address: "to",
          from: "from",
          to: "to",
          hash: "hash",
          transactionHash: "hash",
        },
      ]);
      expect(addressTransactionRepositoryMock.addMany).toBeCalledTimes(1);
    });
  });
});
