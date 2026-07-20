import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { VisibleLogRepository } from "./visibleLog.repository";
import { UnitOfWork } from "../unitOfWork";
import { VisibleLog } from "../entities";

describe("VisibleLogRepository", () => {
  let repository: VisibleLogRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        VisibleLogRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<VisibleLogRepository>(VisibleLogRepository);
  });

  it("extends BaseRepository<VisibleLog>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<VisibleLog>);
  });
});
