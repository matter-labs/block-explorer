import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager, SelectQueryBuilder, InsertQueryBuilder, IsNull, Not } from "typeorm";
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
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        },
      ]),
      update: jest.fn().mockResolvedValue(null),
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

  describe("getOffChainDataLastUpdatedAt", () => {
    it("returns undefined when no offchain data update ever happened", async () => {
      const result = await repository.getOffChainDataLastUpdatedAt();
      expect(entityManagerMock.findOne).toBeCalledWith(Token, {
        where: {
          offChainDataUpdatedAt: Not(IsNull()),
        },
        select: {
          offChainDataUpdatedAt: true,
        },
        order: {
          offChainDataUpdatedAt: "DESC",
        },
      });
      expect(result).toBe(undefined);
    });

    it("queries last offchain data updated date", async () => {
      const lastOffChainDataUpdatedAt = new Date();
      jest.spyOn(entityManagerMock, "findOne").mockResolvedValueOnce({
        offChainDataUpdatedAt: lastOffChainDataUpdatedAt,
      });

      const result = await repository.getOffChainDataLastUpdatedAt();
      expect(entityManagerMock.findOne).toBeCalledWith(Token, {
        where: {
          offChainDataUpdatedAt: Not(IsNull()),
        },
        select: {
          offChainDataUpdatedAt: true,
        },
        order: {
          offChainDataUpdatedAt: "DESC",
        },
      });
      expect(result).toEqual(lastOffChainDataUpdatedAt);
    });
  });

  describe("getBridgedTokens", () => {
    it("returns list of tokens having l1 address with l1Address field by default", async () => {
      const result = await repository.getBridgedTokens();
      expect(entityManagerMock.find).toBeCalledWith(Token, {
        where: {
          l1Address: Not(IsNull()),
        },
        select: {
          l1Address: true,
        },
      });
      expect(result).toEqual([
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        },
      ]);
    });

    it("returns list of tokens having l1 address with specified fields", async () => {
      jest.spyOn(entityManagerMock, "find").mockResolvedValueOnce([
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
          l2Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d2",
        },
      ]);
      const result = await repository.getBridgedTokens({
        l1Address: true,
        l2Address: true,
      });
      expect(entityManagerMock.find).toBeCalledWith(Token, {
        where: {
          l1Address: Not(IsNull()),
        },
        select: {
          l1Address: true,
          l2Address: true,
        },
      });
      expect(result).toEqual([
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
          l2Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d2",
        },
      ]);
    });
  });

  describe("updateTokenOffChainData", () => {
    it("throws error when no l1Address or l2Address provided", async () => {
      const updatedAt = new Date();
      await expect(
        repository.updateTokenOffChainData({
          liquidity: 1000000,
          usdPrice: 55.89037747,
          updatedAt,
        })
      ).rejects.toThrowError("l1Address or l2Address must be provided");
    });

    it("updates token offchain data using l1Address when provided", async () => {
      const updatedAt = new Date();
      await repository.updateTokenOffChainData({
        l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        liquidity: 1000000,
        usdPrice: 55.89037747,
        updatedAt,
      });

      expect(entityManagerMock.update).toBeCalledWith(
        Token,
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        },
        {
          liquidity: 1000000,
          usdPrice: 55.89037747,
          offChainDataUpdatedAt: updatedAt,
        }
      );
    });

    it("updates token offchain data using l2Address when provided", async () => {
      const updatedAt = new Date();
      await repository.updateTokenOffChainData({
        l2Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        liquidity: 1000000,
        usdPrice: 55.89037747,
        updatedAt,
      });

      expect(entityManagerMock.update).toBeCalledWith(
        Token,
        {
          l2Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        },
        {
          liquidity: 1000000,
          usdPrice: 55.89037747,
          offChainDataUpdatedAt: updatedAt,
        }
      );
    });

    it("updates token offchain data when iconURL is not provided", async () => {
      const updatedAt = new Date();
      await repository.updateTokenOffChainData({
        l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        liquidity: 1000000,
        usdPrice: 55.89037747,
        updatedAt,
      });

      expect(entityManagerMock.update).toBeCalledWith(
        Token,
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        },
        {
          liquidity: 1000000,
          usdPrice: 55.89037747,
          offChainDataUpdatedAt: updatedAt,
        }
      );
    });

    it("updates token offchain data when iconURL is provided", async () => {
      const updatedAt = new Date();
      await repository.updateTokenOffChainData({
        l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        liquidity: 1000000,
        usdPrice: 55.89037747,
        updatedAt,
        iconURL: "http://icon.com",
      });

      expect(entityManagerMock.update).toBeCalledWith(
        Token,
        {
          l1Address: "0xD754fF5e8A6f257E162F72578A4Bb0493C0681d1",
        },
        {
          liquidity: 1000000,
          usdPrice: 55.89037747,
          offChainDataUpdatedAt: updatedAt,
          iconURL: "http://icon.com",
        }
      );
    });
  });
});
