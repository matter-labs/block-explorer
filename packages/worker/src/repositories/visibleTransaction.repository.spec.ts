import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { VisibleTransactionRepository } from "./visibleTransaction.repository";
import { UnitOfWork } from "../unitOfWork";
import { VisibleTransaction } from "../entities";

describe("VisibleTransactionRepository", () => {
  let repository: VisibleTransactionRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        VisibleTransactionRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<VisibleTransactionRepository>(VisibleTransactionRepository);
  });

  it("extends BaseRepository<VisibleTransaction>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<VisibleTransaction>);
  });
});
