import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { mock } from "jest-mock-extended";
import { InternalTransactionService, FindInternalTransactionsOptions } from "./internalTransaction.service";
import { InternalTransaction } from "./entities/internalTransaction.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

describe("InternalTransactionService", () => {
  let service: InternalTransactionService;
  let repositoryMock: Repository<InternalTransaction>;
  let queryBuilderMock: SelectQueryBuilder<InternalTransaction>;
  let managerMock: any;

  const internalTransaction = {
    blockNumber: 10,
    traceIndex: 0,
    from: "0xfrom",
    to: "0xto",
    value: "100",
  } as InternalTransaction;

  beforeEach(async () => {
    repositoryMock = mock<Repository<InternalTransaction>>();
    queryBuilderMock = mock<SelectQueryBuilder<InternalTransaction>>();
    managerMock = {
      query: jest.fn().mockResolvedValue([]),
    };

    // Setup QueryBuilder mock chain
    jest.spyOn(repositoryMock, "createQueryBuilder").mockReturnValue(queryBuilderMock);
    jest.spyOn(queryBuilderMock, "leftJoinAndSelect").mockReturnThis();
    jest.spyOn(queryBuilderMock, "andWhere").mockReturnThis();
    jest.spyOn(queryBuilderMock, "orderBy").mockReturnThis();
    jest.spyOn(queryBuilderMock, "addOrderBy").mockReturnThis();
    jest.spyOn(queryBuilderMock, "skip").mockReturnThis();
    jest.spyOn(queryBuilderMock, "take").mockReturnThis();
    jest.spyOn(queryBuilderMock, "getMany").mockResolvedValue([internalTransaction]);

    // Setup manager query mock for contract check
    Object.defineProperty(repositoryMock, "manager", {
      get: () => managerMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalTransactionService,
        {
          provide: getRepositoryToken(InternalTransaction),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<InternalTransactionService>(InternalTransactionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByAddress", () => {
    it("should return internal transactions filtered by address", async () => {
      const options: FindInternalTransactionsOptions = {
        address: "0x123",
      };

      const result = await service.findByAddress(options);

      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith("internalTransaction");
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        "(internalTransaction.from = :address OR internalTransaction.to = :address)",
        { address: normalizeAddressTransformer.to(options.address!) }
      );
      expect(result).toEqual([internalTransaction]);
    });

    it("should handle non-contract addresses (filter by value > 0)", async () => {
      // Mock non-contract (no bytecode or explicit empty response from DB query logic inside service)
      // Default mock is empty array which means !isContract -> true

      await service.findByAddress({ address: "0x123" });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.value > :zero", { zero: "0" });
    });

    it("should handle contract addresses (no value filter)", async () => {
      managerMock.query.mockResolvedValue([{ bytecode: "0x1234" }]);

      await service.findByAddress({ address: "0x123" });

      // verify value filter is NOT called
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith("internalTransaction.value > :zero", { zero: "0" });
    });

    it("should handle error when checking if address is contract (log warning, treat as contract/no filter)", async () => {
      managerMock.query.mockRejectedValue(new Error("DB Error"));
      // We need to spy on logger to verify warning, but Logger is private/protected often.
      // Service handles exception gracefully and continues.

      await service.findByAddress({ address: "0x123" });

      // Should proceed without value filter on error
      expect(queryBuilderMock.andWhere).not.toHaveBeenCalledWith("internalTransaction.value > :zero", { zero: "0" });
    });

    it("should filter by transaction hash", async () => {
      const txHash = "0xtxhash";
      await service.findByAddress({ transactionHash: txHash });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.transactionHash = :transactionHash", {
        transactionHash: normalizeAddressTransformer.to(txHash),
      });
    });

    it("should filter by startBlock and endBlock", async () => {
      await service.findByAddress({ startBlock: 10, endBlock: 20 });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.blockNumber >= :startBlock", {
        startBlock: 10,
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith("internalTransaction.blockNumber <= :endBlock", {
        endBlock: 20,
      });
    });

    it("should apply sorting (ASC)", async () => {
      await service.findByAddress({ sort: "ASC" });
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("internalTransaction.blockNumber", "ASC");
    });

    it("should apply sorting (DESC default)", async () => {
      await service.findByAddress({ sort: "DESC" });
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("internalTransaction.blockNumber", "DESC");
    });

    it("should apply pagination", async () => {
      await service.findByAddress({ page: 2, offset: 50 });
      expect(queryBuilderMock.skip).toHaveBeenCalledWith(50); // (2-1)*50
      expect(queryBuilderMock.take).toHaveBeenCalledWith(50);
    });

    it("should cap pagination limit at 10000", async () => {
      await service.findByAddress({ offset: 20000 });
      expect(queryBuilderMock.take).toHaveBeenCalledWith(10000);
    });
  });

  describe("findByTransactionHash", () => {
    it("should call findByAddress with correct params", async () => {
      const findByAddressSpy = jest.spyOn(service, "findByAddress");
      const txHash = "0xhash";

      await service.findByTransactionHash(txHash);

      expect(findByAddressSpy).toHaveBeenCalledWith({ transactionHash: txHash });
    });
  });
});
