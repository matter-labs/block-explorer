import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager } from "typeorm";
import { BaseRepository } from "./base.repository";
import { TransferRepository } from "./transfer.repository";
import { AddressTransferRepository } from "./addressTransfer.repository";
import { Transfer } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("TransferRepository", () => {
  let repository: TransferRepository;
  let addressTransferRepositoryMock: AddressTransferRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>({
      insert: jest.fn().mockResolvedValue(null),
    });
    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });
    addressTransferRepositoryMock = mock<AddressTransferRepository>({
      addMany: jest.fn().mockResolvedValue(null),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TransferRepository,
        {
          provide: AddressTransferRepository,
          useValue: addressTransferRepositoryMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<TransferRepository>(TransferRepository);
  });

  it("extends BaseRepository<Transfer>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Transfer>);
  });

  describe("addMany", () => {
    it("inserts transfers", async () => {
      const records = [
        {
          number: 1,
          from: "from",
          to: "to",
        },
      ];
      await repository.addMany(records);
      expect(entityManagerMock.insert).toBeCalledWith(Transfer, records);
      expect(entityManagerMock.insert).toBeCalledTimes(1);
    });

    it("inserts address transfer for each from/to", async () => {
      const records = [
        {
          number: 1,
          from: "from",
          to: "from",
        },
        {
          number: 2,
          from: "from",
          to: "to",
        },
      ];
      await repository.addMany(records);

      expect(addressTransferRepositoryMock.addMany).toBeCalledWith([
        {
          address: "from",
          from: "from",
          to: "from",
          transferNumber: 1,
        },
        {
          address: "from",
          from: "from",
          to: "to",
          transferNumber: 2,
        },
        {
          address: "to",
          from: "from",
          to: "to",
          transferNumber: 2,
        },
      ]);
      expect(addressTransferRepositoryMock.addMany).toBeCalledTimes(1);
    });
  });
});
