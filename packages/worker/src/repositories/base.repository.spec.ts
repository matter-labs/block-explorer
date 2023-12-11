import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { EntityManager } from "typeorm";
import { mock } from "jest-mock-extended";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { BaseEntity } from "../entities";

@Injectable()
export class BaseEntityRepository extends BaseRepository<BaseEntity> {
  public constructor(unitOfWork: UnitOfWork) {
    super(BaseEntity, unitOfWork);
  }
}

describe("BaseRepository", () => {
  let repository: BaseRepository<BaseEntity>;
  let entityManagerMock: EntityManager;
  let unitOfWorkMock: UnitOfWork;

  beforeEach(async () => {
    entityManagerMock = mock<EntityManager>();
    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });

    const app = await Test.createTestingModule({
      providers: [
        BaseEntityRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get(BaseEntityRepository);
  });

  describe("addMany", () => {
    let records = [];
    beforeEach(() => {
      records = [mock<BaseEntity>(), mock<BaseEntity>()];
    });

    it("adds records", async () => {
      await repository.addMany(records);
      expect(entityManagerMock.insert).toHaveBeenCalledTimes(1);
      expect(entityManagerMock.insert).toHaveBeenCalledWith(BaseEntity, records);
    });

    describe("when there are more than 1K records", () => {
      beforeEach(() => {
        records = [];
        for (let i = 0; i < 1050; i++) {
          records.push(mock<BaseEntity>());
        }
      });

      it("adds records in batches", async () => {
        await repository.addMany(records);
        expect(entityManagerMock.insert).toHaveBeenCalledTimes(2);
        expect(entityManagerMock.insert).toHaveBeenCalledWith(BaseEntity, records.splice(0, 1000));
        expect(entityManagerMock.insert).toHaveBeenCalledWith(BaseEntity, records.splice(0, 1000));
      });
    });

    it("properly processes null records argument", async () => {
      await repository.addMany(null);
      expect(entityManagerMock.insert).toHaveBeenCalledTimes(0);
    });

    it("properly processes empty records array", async () => {
      await repository.addMany([]);
      expect(entityManagerMock.insert).toHaveBeenCalledTimes(0);
    });
  });

  describe("findOneBy", () => {
    it("calls transactionManager findOneBy with provided params and returns result of the call", async () => {
      const entity = { createdAt: new Date(), updatedAt: new Date() };
      (entityManagerMock.findOneBy as jest.Mock).mockResolvedValue(entity);

      const result = await repository.findOneBy({ createdAt: entity.createdAt });
      expect(entityManagerMock.findOneBy).toBeCalledWith(BaseEntity, { createdAt: entity.createdAt });
      expect(result).toEqual(entity);
    });
  });

  describe("find", () => {
    it("calls transactionManager find with provided options and returns result of the call", async () => {
      const entity = { createdAt: new Date(), updatedAt: new Date() };
      (entityManagerMock.find as jest.Mock).mockResolvedValue([entity]);

      const result = await repository.find({ select: ["createdAt", "updatedAt"] });
      expect(entityManagerMock.find).toBeCalledWith(BaseEntity, { select: ["createdAt", "updatedAt"] });
      expect(result).toEqual([entity]);
    });
  });

  describe("delete", () => {
    it("calls transactionManager delete with provided params", async () => {
      const entity = { createdAt: new Date(), updatedAt: new Date() };

      await repository.delete({ createdAt: entity.createdAt });
      expect(entityManagerMock.delete).toBeCalledWith(BaseEntity, { createdAt: entity.createdAt });
    });
  });

  describe("add", () => {
    it("inserts record into the DB", async () => {
      const entity = { createdAt: "123" };
      await repository.add(entity);

      expect(entityManagerMock.insert).toBeCalledWith(BaseEntity, entity);
    });
  });

  describe("upsert", () => {
    describe("when called with shouldExcludeNullValues = false", () => {
      it("upserts record into the DB as it is", async () => {
        const entity = {
          createdAt: "123",
          updatedAt: null,
        };
        await repository.upsert(entity, false);

        expect(entityManagerMock.upsert).toBeCalledWith(BaseEntity, entity, {
          conflictPaths: ["number"],
          skipUpdateIfNoValuesChanged: true,
        });
      });
    });

    describe("when called with shouldExcludeNullValues = true", () => {
      it("removes fields with null value from a record before upserting it", async () => {
        const entity = {
          createdAt: "123",
          updatedAt: null,
        };
        await repository.upsert(entity, true);

        expect(entityManagerMock.upsert).toBeCalledWith(
          BaseEntity,
          { createdAt: "123" },
          {
            conflictPaths: ["number"],
            skipUpdateIfNoValuesChanged: true,
          }
        );
      });
    });

    describe("when called with no shouldExcludeNullValues param", () => {
      it("removes fields with null value from a record before upserting it", async () => {
        const entity = {
          createdAt: "123",
          updatedAt: null,
        };
        await repository.upsert(entity);

        expect(entityManagerMock.upsert).toBeCalledWith(
          BaseEntity,
          { createdAt: "123" },
          {
            conflictPaths: ["number"],
            skipUpdateIfNoValuesChanged: true,
          }
        );
      });
    });

    describe("when called with conflictPaths param", () => {
      it("calls upsert with provided conflictPaths", async () => {
        const entity = {
          createdAt: "123",
        };
        await repository.upsert(entity, false, ["id"]);

        expect(entityManagerMock.upsert).toBeCalledWith(
          BaseEntity,
          { createdAt: "123" },
          {
            conflictPaths: ["id"],
            skipUpdateIfNoValuesChanged: true,
          }
        );
      });
    });
  });
});
