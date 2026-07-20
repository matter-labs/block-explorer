import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { IndexerStateRepository } from "./indexerState.repository";
import { UnitOfWork } from "../unitOfWork";
import { IndexerState } from "../entities";

describe("IndexerStateRepository", () => {
  let repository: IndexerStateRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        IndexerStateRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<IndexerStateRepository>(IndexerStateRepository);
  });

  it("extends BaseRepository<IndexerState>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<IndexerState>);
  });

  describe("getLastReadyBlockNumber", () => {
    it("returns lastReadyBlockNumber when state exists", async () => {
      (entityManagerMock.findOneBy as jest.Mock).mockResolvedValue({ id: 1, lastReadyBlockNumber: 500 });
      const result = await repository.getLastReadyBlockNumber();
      expect(result).toBe(500);
      expect(entityManagerMock.findOneBy).toHaveBeenCalledWith(IndexerState, { id: 1 });
    });

    it("returns 0 when no state exists", async () => {
      (entityManagerMock.findOneBy as jest.Mock).mockResolvedValue(null);
      const result = await repository.getLastReadyBlockNumber();
      expect(result).toBe(0);
    });
  });

  describe("setLastReadyBlockNumber", () => {
    it("upserts the state with the given block number", async () => {
      (entityManagerMock.upsert as jest.Mock).mockResolvedValue(null);
      await repository.setLastReadyBlockNumber(1000);
      expect(entityManagerMock.upsert).toHaveBeenCalledWith(
        IndexerState,
        { id: 1, lastReadyBlockNumber: 1000 },
        { conflictPaths: ["id"], skipUpdateIfNoValuesChanged: true }
      );
    });
  });
});
