import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { TokenService } from "./token.service";
import { Token } from "./token.entity";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as utils from "../common/utils";

jest.mock("../common/utils");

describe("TokenService", () => {
  let service: TokenService;
  let repositoryMock: Repository<Token>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<Token>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(Token),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findOne", () => {
    let token;
    const tokenAddress = "tokenAddress";

    beforeEach(() => {
      token = {
        l2Address: tokenAddress,
      };
      (repositoryMock.findOneBy as jest.Mock).mockResolvedValue(token);
    });

    it("queries tokens by specified token address", async () => {
      await service.findOne(tokenAddress);
      expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ l2Address: tokenAddress });
    });

    it("returns token by address", async () => {
      const result = await service.findOne(tokenAddress);
      expect(result).toBe(token);
    });

    describe("when requested token does not exist", () => {
      beforeEach(() => {
        (repositoryMock.findOneBy as jest.Mock).mockResolvedValue(null);
      });

      it("returns ETH token for ETH address", async () => {
        const result = await service.findOne("0x000000000000000000000000000000000000800a");
        expect(result).toEqual({
          decimals: 18,
          l1Address: null,
          l2Address: "0x000000000000000000000000000000000000800A",
          name: "Ether",
          symbol: "ETH",
        });
      });

      it("returns null for non ETH address", async () => {
        const result = await service.findOne("0x000000000000000000000000000000000000800b");
        expect(result).toBeNull();
      });
    });
  });

  describe("exists", () => {
    let token;
    const tokenAddress = "tokenAddress";

    beforeEach(() => {
      token = {
        l2Address: tokenAddress,
      };
      repositoryMock.findOne as jest.Mock;
    });

    it("filters tokens by the specified address", async () => {
      await service.exists(tokenAddress);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { l2Address: tokenAddress },
        select: { l2Address: true },
      });
    });

    it("returns true if there is a token with specified address", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValue(token);
      const result = await service.exists(tokenAddress);
      expect(result).toBe(true);
    });

    describe("when requested token does not exist", () => {
      beforeEach(() => {
        (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      });

      it("returns true for ETH address", async () => {
        const result = await service.exists("0x000000000000000000000000000000000000800a");
        expect(result).toBe(true);
      });

      it("returns false for non ETH address", async () => {
        const result = await service.exists(tokenAddress);
        expect(result).toBe(false);
      });
    });
  });

  describe("findAll", () => {
    let queryBuilderMock;
    const pagingOptions = {
      limit: 10,
      page: 2,
    };

    beforeEach(() => {
      queryBuilderMock = mock<SelectQueryBuilder<Token>>();
      (repositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
    });

    it("creates query builder with proper params", async () => {
      await service.findAll(pagingOptions);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("token");
    });

    it("returns tokens ordered by blockNumber and logIndex DESC", async () => {
      await service.findAll(pagingOptions);
      expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("token.blockNumber", "DESC");
      expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
      expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("token.logIndex", "DESC");
    });

    it("returns paginated result", async () => {
      const paginationResult = mock<Pagination<Token, IPaginationMeta>>();
      (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      const result = await service.findAll(pagingOptions);
      expect(utils.paginate).toBeCalledTimes(1);
      expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions);
      expect(result).toBe(paginationResult);
    });
  });
});
