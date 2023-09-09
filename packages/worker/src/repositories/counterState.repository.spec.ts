import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { CounterStateRepository } from "./counterState.repository";
import { UnitOfWork } from "../unitOfWork";
import { CounterState } from "../entities";

describe("CounterStateRepository", () => {
  let repository: CounterStateRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        CounterStateRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<CounterStateRepository>(CounterStateRepository);
  });

  it("extends BaseRepository<CounterState>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<CounterState>);
  });
});
