import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { AddressTransactionRepository } from "./addressTransaction.repository";
import { UnitOfWork } from "../unitOfWork";
import { AddressTransaction } from "../entities";

describe("AddressTransactionRepository", () => {
  let repository: AddressTransactionRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        AddressTransactionRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<AddressTransactionRepository>(AddressTransactionRepository);
  });

  it("extends BaseRepository<AddressTransaction>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<AddressTransaction>);
  });
});
