import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { BadRequestException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as typeorm from "typeorm";
import { Brackets } from "typeorm";
import { SortingOrder } from "../common/types";
import {
  TransferService,
  FilterTransfersOptions,
  FilterTokenTransfersOptions,
  FilterInternalTransfersOptions,
} from "./transfer.service";
import { Transfer } from "./transfer.entity";
import { TokenType } from "../token/token.entity";
import { AddressTransfer } from "./addressTransfer.entity";
import * as utils from "../common/utils";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { IndexerStateService } from "../indexerState/indexerState.service";

jest.mock("../common/utils", () => ({
  ...jest.requireActual("../common/utils"),
  paginate: jest.fn(),
}));

describe("TransferService", () => {
  let service: TransferService;
  let transferRepositoryMock: typeorm.Repository<Transfer>;
  let addressTransferRepositoryMock: typeorm.Repository<AddressTransfer>;

  const pagingOptions = {
    limit: 10,
    page: 2,
    filterOptions: null,
    maxLimit: null,
  };

  beforeEach(async () => {
    transferRepositoryMock = mock<typeorm.Repository<Transfer>>();
    addressTransferRepositoryMock = mock<typeorm.Repository<AddressTransfer>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: getRepositoryToken(Transfer),
          useValue: transferRepositoryMock,
        },
        {
          provide: getRepositoryToken(AddressTransfer),
          useValue: addressTransferRepositoryMock,
        },
        {
          provide: IndexerStateService,
          useValue: { getLastReadyBlockNumber: jest.fn().mockResolvedValue(1_000_000) },
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("findAll", () => {
    let queryBuilderMock;
    let filterOptions: FilterTransfersOptions;
    let addressTransfersQueryBuilderMock;

    beforeEach(() => {
      queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transfer>>();
      addressTransfersQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressTransfer>>();
      (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (addressTransferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(addressTransfersQueryBuilderMock);
    });

    describe("when address filter options is not specified", () => {
      beforeEach(() => {
        filterOptions = {
          tokenAddress: "tokenAddress",
          transactionHash: "transactionHash",
        };
      });

      it("creates query builder with proper params", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      describe("when filter options are not specified", () => {
        beforeEach(() => {
          filterOptions = undefined;
        });

        it("filters transfers using default findOptions", async () => {
          await service.findAll(filterOptions, pagingOptions);
          expect(queryBuilderMock.where).toBeCalledTimes(1);
          expect(queryBuilderMock.where).toHaveBeenCalledWith({});
        });
      });

      describe("when filter options are specified", () => {
        it("filters transfers using specified findOptions", async () => {
          await service.findAll(filterOptions, pagingOptions);
          expect(queryBuilderMock.where).toBeCalledTimes(1);
          expect(queryBuilderMock.where).toHaveBeenCalledWith({
            tokenAddress: "tokenAddress",
            transactionHash: "transactionHash",
          });
        });
      });

      it("selects transfer number", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(queryBuilderMock.select).toHaveBeenCalledWith("transfer.number", "number");
      });

      it("returns transfers ordered by blockNumber ASC and logIndex ASC when transactionHash is specified", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "ASC");
      });

      it("returns paginated result with wrapQuery", async () => {
        const paginationResult = mock<Pagination<Transfer, IPaginationMeta>>();
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        const result = await service.findAll(filterOptions, pagingOptions);
        expect(utils.paginate).toBeCalledTimes(1);
        expect(utils.paginate).toBeCalledWith({
          queryBuilder: queryBuilderMock,
          options: pagingOptions,
          wrapQuery: expect.any(Function),
        });
        expect(result).toBe(paginationResult);
      });

      it("wrapQuery builds outer query with inner join on transfer number", async () => {
        let outerTransferQbMock;
        (utils.paginate as jest.Mock).mockImplementation(async ({ wrapQuery }) => {
          const pagedInnerQbMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
            getQuery: jest.fn().mockReturnValue("inner SQL"),
            getParameters: jest.fn().mockReturnValue({ param1: "value1" }),
          });
          Object.defineProperty(pagedInnerQbMock, "expressionMap", {
            value: { orderBys: { "transfer.blockNumber": "DESC" } },
          });

          outerTransferQbMock = mock<typeorm.SelectQueryBuilder<Transfer>>();
          (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(outerTransferQbMock);

          await wrapQuery(pagedInnerQbMock);
          return { items: [] };
        });

        await service.findAll(filterOptions, pagingOptions);

        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
        expect(outerTransferQbMock.innerJoin).toHaveBeenCalledWith(
          "(inner SQL)",
          "_paginated",
          `"_paginated"."number" = "transfer"."number"`
        );
        expect(outerTransferQbMock.setParameters).toHaveBeenCalledWith({ param1: "value1" });
        expect(outerTransferQbMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
        expect(outerTransferQbMock.addOrderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
      });
    });

    describe("when address filter options is specified", () => {
      const paginationResult = mock<Pagination<Transfer, IPaginationMeta>>();

      beforeEach(() => {
        filterOptions = {
          address: "address",
        };
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
      });

      it("creates query builder on addressTransferRepository", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("at");
      });

      it("selects transferNumber", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.select).toHaveBeenCalledWith("at.transferNumber", "transferNumber");
      });

      it("filters with address", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.where).toHaveBeenCalledWith({ address: "address" });
      });

      it("orders by at blockNumber DESC and logIndex DESC", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.orderBy).toHaveBeenCalledWith("at.blockNumber", "DESC");
        expect(addressTransfersQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("at.logIndex", "DESC");
      });

      it("returns paginated result with wrapQuery", async () => {
        const result = await service.findAll(filterOptions, pagingOptions);
        expect(utils.paginate).toBeCalledWith({
          queryBuilder: addressTransfersQueryBuilderMock,
          options: pagingOptions,
          wrapQuery: expect.any(Function),
        });
        expect(result).toBe(paginationResult);
      });
    });

    describe("when visibleBy and address are both set (two-party)", () => {
      const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const tokenAddress = "0x976EA74026E726554dB657fA54763abd0C3a0aa9";

      it("uses transferRepository with fromToMin/fromToMax in where", async () => {
        await service.findAll({ address, visibleBy, tokenAddress }, pagingOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
        // address > visibleBy lexicographically, so fromToMin=visibleBy, fromToMax=address
        expect(queryBuilderMock.where).toHaveBeenCalledWith({
          tokenAddress,
          fromToMin: visibleBy,
          fromToMax: address,
        });
      });
    });

    describe("when visibleBy is set without address (own transfers)", () => {
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      beforeEach(() => {
        (utils.paginate as jest.Mock).mockResolvedValue({ items: [] });
      });

      it("uses addressTransferRepository", async () => {
        await service.findAll({ visibleBy }, pagingOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("at");
      });

      it("filters by visibleBy as address", async () => {
        await service.findAll({ visibleBy }, pagingOptions);
        expect(addressTransfersQueryBuilderMock.where).toHaveBeenCalledWith({ address: visibleBy });
      });
    });

    describe("when visibleBy is set with transactionHash", () => {
      const visibleBy = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const transactionHash = "0xabc123";

      it("uses transferRepository with from/to Brackets", async () => {
        await service.findAll({ visibleBy, transactionHash }, pagingOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
        expect(queryBuilderMock.where).toHaveBeenCalledWith({ transactionHash });
        const brackets = (queryBuilderMock.andWhere as jest.Mock).mock.calls[1][0] as Brackets;
        expect(brackets).toBeInstanceOf(Brackets);
        const innerQb = mock<typeorm.WhereExpressionBuilder>();
        (innerQb.where as jest.Mock).mockReturnValue(innerQb);
        brackets.whereFactory(innerQb as any);
        expect(innerQb.where).toHaveBeenCalledWith({ from: visibleBy });
        expect(innerQb.orWhere).toHaveBeenCalledWith({ to: visibleBy });
      });
    });
  });

  describe("findTokenTransfers", () => {
    let innerQueryBuilderMock;
    let outerQueryBuilderMock;
    let innerAddressTransfersQbMock;
    let outerAddressTransfersQbMock;
    let filterOptions: FilterTokenTransfersOptions;

    beforeEach(() => {
      innerQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
        getQuery: jest.fn().mockReturnValue("inner query"),
        getParameters: jest.fn().mockReturnValue({}),
      });
      outerQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      innerAddressTransfersQbMock = mock<typeorm.SelectQueryBuilder<AddressTransfer>>({
        getQuery: jest.fn().mockReturnValue("inner query"),
        getParameters: jest.fn().mockReturnValue({}),
      });
      outerAddressTransfersQbMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      (transferRepositoryMock.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(innerQueryBuilderMock)
        .mockReturnValueOnce(outerQueryBuilderMock);
      (addressTransferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(innerAddressTransfersQbMock);
    });

    describe("when address filter options is not specified", () => {
      beforeEach(() => {
        filterOptions = {
          tokenAddress: "tokenAddress",
        };
      });

      it("throws an error if token address filter is not specified", async () => {
        await expect(service.findTokenTransfers()).rejects.toThrowError(
          new BadRequestException("Error! Missing address or contract address")
        );
      });

      it("creates two query builders for inner and outer queries", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(2);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      it("inner query filters by tokenAddress", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(innerQueryBuilderMock.select).toHaveBeenCalledWith("transfer.number", "number");
        expect(innerQueryBuilderMock.where).toHaveBeenCalledWith({ tokenAddress: "tokenAddress" });
      });

      it("inner query adds start block filter when startBlock is specified", async () => {
        await service.findTokenTransfers({ ...filterOptions, startBlock: 10 });
        expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("inner query adds end block filter when endBlock is specified", async () => {
        await service.findTokenTransfers({ ...filterOptions, endBlock: 10 });
        expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("inner query sets offset and limit", async () => {
        await service.findTokenTransfers({ ...filterOptions, page: 2, offset: 100 });
        expect(innerQueryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(innerQueryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("sorts by descending order by default", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(innerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
        expect(innerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "DESC");
        expect(outerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
        expect(outerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findTokenTransfers({ ...filterOptions, sort: SortingOrder.Asc });
        expect(innerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
        expect(outerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
      });

      it("outer query joins token, transaction and receipt", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(outerQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
        expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
      });

      it("executes outer query and returns transfers list", async () => {
        const result = await service.findTokenTransfers(filterOptions);
        expect(result).toEqual([]);
        expect(outerQueryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });

    describe("when address filter options is specified", () => {
      beforeEach(() => {
        filterOptions = {
          address: "address",
        };
        // After inner addressTransfer QB, the outer is from transferRepository
        (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReset();
        outerAddressTransfersQbMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
          getMany: jest.fn().mockResolvedValue([]),
        });
        (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(outerAddressTransfersQbMock);
      });

      it("creates inner query builder on addressTransferRepository", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransfer");
      });

      it("creates outer query builder on transferRepository", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      describe("when token type is ERC20", () => {
        it("inner query adds address and ERC20 filter", async () => {
          await service.findTokenTransfers(filterOptions);
          expect(innerAddressTransfersQbMock.where).toHaveBeenCalledWith({ address: "address" });
          expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith(
            `"addressTransfer"."tokenType" = :tokenType`,
            { tokenType: TokenType.ERC20 }
          );
        });
      });

      describe("when token type is ERC721", () => {
        it("inner query adds ERC721 filter", async () => {
          await service.findTokenTransfers({ ...filterOptions, tokenType: TokenType.ERC721 });
          expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith(
            `"addressTransfer"."tokenType" = :tokenType`,
            { tokenType: TokenType.ERC721 }
          );
        });
      });

      describe("when token address is specified", () => {
        it("inner query adds token address filter", async () => {
          await service.findTokenTransfers({
            ...filterOptions,
            tokenAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
          });
          expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith(
            `"addressTransfer"."tokenAddress" = :tokenAddress`,
            { tokenAddress: normalizeAddressTransformer.to("0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E") }
          );
        });
      });

      it("inner query sets offset and limit", async () => {
        await service.findTokenTransfers({ ...filterOptions, page: 2, offset: 100 });
        expect(innerAddressTransfersQbMock.offset).toHaveBeenCalledWith(100);
        expect(innerAddressTransfersQbMock.limit).toHaveBeenCalledWith(100);
      });

      it("inner query adds start block filter when startBlock is specified", async () => {
        await service.findTokenTransfers({ ...filterOptions, startBlock: 10 });
        expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("inner query adds end block filter when endBlock is specified", async () => {
        await service.findTokenTransfers({ ...filterOptions, endBlock: 10 });
        expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("outer query joins token, transaction and receipt", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(outerAddressTransfersQbMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
        expect(outerAddressTransfersQbMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(outerAddressTransfersQbMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
      });

      it("sorts by descending order by default", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(innerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "DESC");
        expect(outerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findTokenTransfers({ ...filterOptions, sort: SortingOrder.Asc });
        expect(innerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "ASC");
        expect(outerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
      });

      it("executes outer query and returns transfers list", async () => {
        const result = await service.findTokenTransfers(filterOptions);
        expect(result).toEqual([]);
        expect(outerAddressTransfersQbMock.getMany).toBeCalledTimes(1);
      });
    });
  });

  describe("findInternalTransfers", () => {
    let innerQueryBuilderMock;
    let outerQueryBuilderMock;
    let innerAddressTransfersQbMock;
    let outerAddressTransfersQbMock;
    let filterOptions: FilterInternalTransfersOptions;

    beforeEach(() => {
      innerQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
        getQuery: jest.fn().mockReturnValue("inner query"),
        getParameters: jest.fn().mockReturnValue({}),
      });
      outerQueryBuilderMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      innerAddressTransfersQbMock = mock<typeorm.SelectQueryBuilder<AddressTransfer>>({
        getQuery: jest.fn().mockReturnValue("inner query"),
        getParameters: jest.fn().mockReturnValue({}),
      });
      outerAddressTransfersQbMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
        getMany: jest.fn().mockResolvedValue([]),
      });
      (transferRepositoryMock.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(innerQueryBuilderMock)
        .mockReturnValueOnce(outerQueryBuilderMock);
      (addressTransferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(innerAddressTransfersQbMock);
    });

    describe("when address filter options is not specified", () => {
      beforeEach(() => {
        filterOptions = {};
      });

      it("creates two query builders for inner and outer queries", async () => {
        await service.findInternalTransfers();
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(2);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      describe("when transaction hash filter is specified", () => {
        it("inner query adds transaction hash filter", async () => {
          await service.findInternalTransfers({ ...filterOptions, transactionHash: "txhash" });
          expect(innerQueryBuilderMock.where).toHaveBeenCalledWith({
            transactionHash: "txhash",
            isInternal: true,
          });
        });
      });

      describe("when transaction hash filter is not specified", () => {
        it("inner query does not add transaction hash filter", async () => {
          await service.findInternalTransfers(filterOptions);
          expect(innerQueryBuilderMock.where).toHaveBeenCalledWith({ isInternal: true });
        });
      });

      it("outer query joins transactions and transaction receipts", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(outerQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transaction.receiptStatus",
          "transaction.gasLimit",
          "transaction.fee",
          "transaction.type",
        ]);
        expect(outerQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
        expect(outerQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("inner query adds start block filter when startBlock is specified", async () => {
        await service.findInternalTransfers({ ...filterOptions, startBlock: 10 });
        expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("inner query adds end block filter when endBlock is specified", async () => {
        await service.findInternalTransfers({ ...filterOptions, endBlock: 10 });
        expect(innerQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("sorts by descending order by default", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(innerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
        expect(innerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "DESC");
        expect(outerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
        expect(outerQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findInternalTransfers({ ...filterOptions, sort: SortingOrder.Asc });
        expect(innerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
        expect(outerQueryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
      });

      it("inner query sets offset and limit", async () => {
        await service.findInternalTransfers({ ...filterOptions, page: 2, offset: 100 });
        expect(innerQueryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(innerQueryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("executes outer query and returns transfers list", async () => {
        const result = await service.findInternalTransfers(filterOptions);
        expect(result).toEqual([]);
        expect(outerQueryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });

    describe("when address filter option is specified", () => {
      beforeEach(() => {
        filterOptions = { address: "address" };
        // After inner addressTransfer QB, the outer is from transferRepository
        (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReset();
        outerAddressTransfersQbMock = mock<typeorm.SelectQueryBuilder<Transfer>>({
          getMany: jest.fn().mockResolvedValue([]),
        });
        (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(outerAddressTransfersQbMock);
      });

      it("creates inner query builder on addressTransferRepository", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransfer");
      });

      it("creates outer query builder on transferRepository", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      it("inner query adds address filter", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(innerAddressTransfersQbMock.where).toHaveBeenCalledWith({
          address: "address",
          isInternal: true,
        });
      });

      it("outer query joins transaction and receipt", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(outerAddressTransfersQbMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(outerAddressTransfersQbMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
      });

      it("inner query adds start block filter when startBlock is specified", async () => {
        await service.findInternalTransfers({ ...filterOptions, startBlock: 10 });
        expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("inner query adds end block filter when endBlock is specified", async () => {
        await service.findInternalTransfers({ ...filterOptions, endBlock: 10 });
        expect(innerAddressTransfersQbMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("sorts by descending order by default", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(innerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "DESC");
        expect(outerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findInternalTransfers({ ...filterOptions, sort: SortingOrder.Asc });
        expect(innerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "ASC");
        expect(outerAddressTransfersQbMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
      });

      it("inner query sets offset and limit", async () => {
        await service.findInternalTransfers({ ...filterOptions, page: 2, offset: 100 });
        expect(innerAddressTransfersQbMock.offset).toHaveBeenCalledWith(100);
        expect(innerAddressTransfersQbMock.limit).toHaveBeenCalledWith(100);
      });

      it("executes outer query and returns transfers list", async () => {
        const result = await service.findInternalTransfers(filterOptions);
        expect(result).toEqual([]);
        expect(outerAddressTransfersQbMock.getMany).toBeCalledTimes(1);
      });
    });
  });
});
