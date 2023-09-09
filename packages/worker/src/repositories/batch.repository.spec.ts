import { Test } from "@nestjs/testing";
import { EntityManager, Not, IsNull } from "typeorm";
import { mock } from "jest-mock-extended";
import { BatchRepository } from "./batch.repository";
import { BaseRepository } from "./base.repository";
import { Batch } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("BatchRepository", () => {
  let repository: BatchRepository;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    const unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        BatchRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<BatchRepository>(BatchRepository);
  });

  it("extends BaseRepository<Batch>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Batch>);
  });

  describe("getLastBatch", () => {
    beforeEach(() => {
      (entityManagerMock.findOne as jest.Mock).mockResolvedValue({
        number: 100,
      });
    });

    it("makes a DB query and returns the last batch when it exists", async () => {
      const criteria = { committedAt: Not(IsNull()) };
      const lastBatch = await repository.getLastBatch(criteria);

      expect(entityManagerMock.findOne).toBeCalledWith(Batch, {
        where: criteria,
        order: { number: "DESC" },
      });
      expect(lastBatch).toEqual({ number: 100 });
    });

    it("calls repository with no criteria when no criteria is provided", async () => {
      const lastBatch = await repository.getLastBatch();

      expect(entityManagerMock.findOne).toBeCalledWith(Batch, {
        where: {},
        order: { number: "DESC" },
      });
      expect(lastBatch).toEqual({ number: 100 });
    });

    it("calls repository with select options when provided", async () => {
      const lastBatch = await repository.getLastBatch({}, { number: true });

      expect(entityManagerMock.findOne).toBeCalledWith(Batch, {
        where: {},
        select: { number: true },
        order: { number: "DESC" },
      });
      expect(lastBatch).toEqual({ number: 100 });
    });

    it("returns null when there is no batch for the given criteria in the DB", async () => {
      (entityManagerMock.findOne as jest.Mock).mockResolvedValue(null);

      const criteria = { executedAt: Not(IsNull()) };
      const lastBatch = await repository.getLastBatch(criteria);

      expect(entityManagerMock.findOne).toBeCalledWith(Batch, {
        where: criteria,
        order: { number: "DESC" },
      });
      expect(lastBatch).toBe(null);
    });
  });
});
