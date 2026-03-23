import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { AddressVisibleTransactionRepository } from "./addressVisibleTransaction.repository";
import { UnitOfWork } from "../unitOfWork";
import { AddressVisibleTransaction } from "../entities";

describe("AddressVisibleTransactionRepository", () => {
  let repository: AddressVisibleTransactionRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        AddressVisibleTransactionRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<AddressVisibleTransactionRepository>(AddressVisibleTransactionRepository);
  });

  it("extends BaseRepository<AddressVisibleTransaction>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<AddressVisibleTransaction>);
  });
});
