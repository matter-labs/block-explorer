import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager, SelectQueryBuilder, InsertQueryBuilder } from "typeorm";
import { BaseRepository } from "./base.repository";
import { TokenRepository } from "./token.repository";
import { Token } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("TokenRepository", () => {
  let repository: TokenRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;
  let queryBuilderMock: SelectQueryBuilder<Token>;
  let insertQueryBuilderMock: InsertQueryBuilder<Token>;

  beforeEach(async () => {
    insertQueryBuilderMock = mock<InsertQueryBuilder<Token>>();

    queryBuilderMock = mock<SelectQueryBuilder<Token>>({
      insert: jest.fn().mockReturnValue(insertQueryBuilderMock),
    });

    entityManagerMock = mock<EntityManager>({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    });

    unitOfWorkMock = mock<UnitOfWork>({ getTransactionManager: jest.fn().mockReturnValue(entityManagerMock) });
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<TokenRepository>(TokenRepository);
  });

  it("extends BaseRepository<Token>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Token>);
  });

  describe("upsert", () => {
    const token: Token = mock<Token>({});

    it("executes upsert query", async () => {
      await repository.upsert(token);
      expect(entityManagerMock.createQueryBuilder).toBeCalledTimes(1);

      expect(queryBuilderMock.insert).toBeCalledTimes(1);
      expect(queryBuilderMock.insert).toBeCalledWith();

      expect(insertQueryBuilderMock.into).toBeCalledTimes(1);
      expect(insertQueryBuilderMock.into).toBeCalledWith(Token);

      expect(insertQueryBuilderMock.values).toBeCalledTimes(1);
      expect(insertQueryBuilderMock.values).toBeCalledWith(token);

      expect(insertQueryBuilderMock.onConflict).toBeCalledTimes(1);
      expect(insertQueryBuilderMock.onConflict).toBeCalledWith(
        `("l2Address") DO UPDATE 
        SET 
          "updatedAt" = CURRENT_TIMESTAMP,
          symbol = EXCLUDED.symbol,
          name = EXCLUDED.name,
          decimals = EXCLUDED.decimals,
          "blockNumber" = EXCLUDED."blockNumber",
          "l1Address" = EXCLUDED."l1Address",
          "transactionHash" = EXCLUDED."transactionHash",
          "logIndex" = EXCLUDED."logIndex"
        WHERE 
          tokens."blockNumber" IS NULL OR
          EXCLUDED."blockNumber" > tokens."blockNumber" OR 
          (EXCLUDED."blockNumber" = tokens."blockNumber" AND EXCLUDED."logIndex" > tokens."logIndex")
      `
      );
      expect(insertQueryBuilderMock.execute).toBeCalledTimes(1);
    });
  });
});
