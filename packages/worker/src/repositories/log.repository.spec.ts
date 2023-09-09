import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager } from "typeorm";
import { BaseRepository } from "./base.repository";
import { LogRepository } from "./log.repository";
import { Log } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("LogRepository", () => {
  let repository: LogRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>();
    entityManagerMock = mock<EntityManager>();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        LogRepository,
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<LogRepository>(LogRepository);
  });

  it("extends BaseRepository<Log>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Log>);
  });
});
