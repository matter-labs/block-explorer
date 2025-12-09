import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { mock } from "jest-mock-extended";
import { InternalTransactionService, FilterInternalTransactionsOptions } from "./internalTransaction.service";
import { InternalTransaction } from "./entities/internalTransaction.entity";
import { Address } from "../address/address.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import * as utils from "../common/utils";

jest.mock("../common/utils");

describe("InternalTransactionService", () => {
  let service: InternalTransactionService;
  let repositoryMock: Repository<InternalTransaction>;
  let addressRepositoryMock: Repository<Address>;
  let queryBuilderMock: SelectQueryBuilder<InternalTransaction>;

  const internalTransaction = {
    blockNumber: 10,
    traceIndex: 0,
    from: "0xfrom",
    to: "0xto",
    value: "100",
  } as InternalTransaction;

  beforeEach(async () => {
    repositoryMock = mock<Repository<InternalTransaction>>();
    addressRepositoryMock = mock<Repository<Address>>();
    queryBuilderMock = mock<SelectQueryBuilder<InternalTransaction>>();

    // Setup QueryBuilder mock chain
    jest.spyOn(repositoryMock, "createQueryBuilder").mockReturnValue(queryBuilderMock);
    jest.spyOn(queryBuilderMock, "leftJoinAndSelect").mockReturnThis();
    jest.spyOn(queryBuilderMock, "andWhere").mockReturnThis();
    jest.spyOn(queryBuilderMock, "orderBy").mockReturnThis();
    jest.spyOn(queryBuilderMock, "addOrderBy").mockReturnThis();

    // Default mock response for address repository
    (addressRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalTransactionService,
        {
          provide: getRepositoryToken(InternalTransaction),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(Address),
          useValue: addressRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<InternalTransactionService>(InternalTransactionService);
    (utils.paginate as jest.Mock).mockResolvedValue({ items: [internalTransaction] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return internal transactions filtered by address", async () => {
      const options: FilterInternalTransactionsOptions = {
        address: "0x123",
      };

      const result = await service.findAll(options, { page: 1, limit: 10 });

      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("internalTransaction");
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        "(internalTransaction.from = :address OR internalTransaction.to = :address)",
        { address: normalizeAddressTransformer.to(options.address || "") }
      );
      expect(result).toEqual({ items: [internalTransaction] });
    });

    it("should handle non-contract addresses (filter by value > 0)", async () => {
      (addressRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      await service.findAll({ address: "0x123" }, { page: 1, limit: 10 });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.value > :zero", { zero: "0" });
    });

    it("should handle contract addresses (no value filter)", async () => {
      (addressRepositoryMock.findOne as jest.Mock).mockResolvedValue({ bytecode: "0x1234" } as Address);

      await service.findAll({ address: "0x123" }, { page: 1, limit: 10 });

      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith("internalTransaction.value > :zero", { zero: "0" });
    });

    it("should handle error when checking if address is contract (log warning, treat as contract/no filter)", async () => {
      (addressRepositoryMock.findOne as jest.Mock).mockRejectedValue(new Error("DB Error"));

      await service.findAll({ address: "0x123" }, { page: 1, limit: 10 });

      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith("internalTransaction.value > :zero", { zero: "0" });
    });

    it("should filter by transaction hash", async () => {
      const txHash = "0xtxhash";
      await service.findAll({ transactionHash: txHash }, { page: 1, limit: 10 });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.transactionHash = :transactionHash", {
        transactionHash: normalizeAddressTransformer.to(txHash),
      });
    });

    it("should filter by startBlock and endBlock", async () => {
      await service.findAll({ startBlock: 10, endBlock: 20 }, { page: 1, limit: 10 });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.blockNumber >= :startBlock", {
        startBlock: 10,
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.blockNumber <= :endBlock", {
        endBlock: 20,
      });
    });

    it("should apply sorting (ASC)", async () => {
      await service.findAll({ sort: "ASC" }, { page: 1, limit: 10 });
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("internalTransaction.blockNumber", "ASC");
    });

    it("should apply sorting (DESC default)", async () => {
      await service.findAll({ sort: "DESC" }, { page: 1, limit: 10 });
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("internalTransaction.blockNumber", "DESC");
    });

    it("should apply pagination", async () => {
      await service.findAll({ address: "0x123" }, { page: 2, limit: 50 });
      expect(utils.paginate).toHaveBeenCalledWith(queryBuilderMock, {
        limit: 50,
        page: 2,
      });
    });

    it("should pass through maxLimit when provided", async () => {
      await service.findAll({ address: "0x123" }, { limit: 20, page: 1, maxLimit: 5000 });
      expect(utils.paginate).toHaveBeenCalledWith(queryBuilderMock, {
        limit: 20,
        maxLimit: 5000,
        page: 1,
      });
    });
  });

  describe("findByTransactionHash", () => {
    it("should call findAll with correct params", async () => {
      const findAllSpy = jest.spyOn(service, "findAll");
      const txHash = "0xhash";

      await service.findByTransactionHash(txHash);

      expect(findAllSpy).toHaveBeenCalledWith({ transactionHash: txHash }, { page: 1, limit: 10 });
    });
  });
});
