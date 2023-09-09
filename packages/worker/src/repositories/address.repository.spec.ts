import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager, SelectQueryBuilder, InsertQueryBuilder } from "typeorm";
import { AddressRepository } from "./address.repository";
import { BaseRepository } from "./base.repository";
import { UnitOfWork } from "../unitOfWork";
import { Address } from "../entities";

describe("AddressRepository", () => {
  let repository: AddressRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;
  let queryBuilderMock: SelectQueryBuilder<Address>;
  let insertQueryBuilderMock: InsertQueryBuilder<Address>;

  beforeEach(async () => {
    insertQueryBuilderMock = mock<InsertQueryBuilder<Address>>();

    queryBuilderMock = mock<SelectQueryBuilder<Address>>({
      insert: jest.fn().mockReturnValue(insertQueryBuilderMock),
    });

    entityManagerMock = mock<EntityManager>({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    });

    unitOfWorkMock = mock<UnitOfWork>({ getTransactionManager: jest.fn().mockReturnValue(entityManagerMock) });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AddressRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<AddressRepository>(AddressRepository);
  });

  it("extends BaseRepository<Address>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Address>);
  });

  describe("upsert", () => {
    const address: Address = mock<Address>({});

    it("executes upsert query", async () => {
      await repository.upsert(address);
      expect(entityManagerMock.createQueryBuilder).toBeCalledTimes(1);

      expect(queryBuilderMock.insert).toBeCalledTimes(1);
      expect(queryBuilderMock.insert).toBeCalledWith();

      expect(insertQueryBuilderMock.into).toBeCalledTimes(1);
      expect(insertQueryBuilderMock.into).toBeCalledWith(Address);

      expect(insertQueryBuilderMock.values).toBeCalledTimes(1);
      expect(insertQueryBuilderMock.values).toBeCalledWith(address);

      expect(insertQueryBuilderMock.onConflict).toBeCalledTimes(1);
      expect(insertQueryBuilderMock.onConflict).toBeCalledWith(
        `("address") DO UPDATE 
        SET 
          "updatedAt" = CURRENT_TIMESTAMP,
          address = EXCLUDED.address,
          bytecode = EXCLUDED.bytecode,
          "createdInBlockNumber" = EXCLUDED."createdInBlockNumber",
          "creatorTxHash" = EXCLUDED."creatorTxHash",
          "creatorAddress" = EXCLUDED."creatorAddress",
          "createdInLogIndex" = EXCLUDED."createdInLogIndex"
        WHERE 
          addresses."createdInBlockNumber" IS NULL OR
          EXCLUDED."createdInBlockNumber" > addresses."createdInBlockNumber" OR 
          (
            EXCLUDED."createdInBlockNumber" = addresses."createdInBlockNumber" AND
            EXCLUDED."createdInLogIndex" > addresses."createdInLogIndex"
          )
      `
      );
      expect(insertQueryBuilderMock.execute).toBeCalledTimes(1);
    });
  });
});
