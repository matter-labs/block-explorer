import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { AddressTransferRepository } from "./addressTransfer.repository";
import { UnitOfWork } from "../unitOfWork";
import { AddressTransfer } from "../entities";

describe("AddressTransferRepository", () => {
  let repository: AddressTransferRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        AddressTransferRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<AddressTransferRepository>(AddressTransferRepository);
  });

  it("extends BaseRepository<AddressTransfer>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<AddressTransfer>);
  });
});
