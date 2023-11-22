import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { BadRequestException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Pagination, IPaginationMeta } from "nestjs-typeorm-paginate";
import * as typeorm from "typeorm";
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

jest.mock("../common/utils");

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

      it("joins token records to the transfers", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
        expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
      });

      it("returns transfers ordered by timestamp DESC and logIndex ASC", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.timestamp", "DESC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "ASC");
      });

      it("returns paginated result", async () => {
        const paginationResult = mock<Pagination<Transfer, IPaginationMeta>>();
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        const result = await service.findAll(filterOptions, pagingOptions);
        expect(utils.paginate).toBeCalledTimes(1);
        expect(utils.paginate).toBeCalledWith(queryBuilderMock, pagingOptions);
        expect(result).toBe(paginationResult);
      });
    });

    describe("when address filter options is specified", () => {
      beforeEach(() => {
        filterOptions = {
          address: "address",
        };
        (utils.paginate as jest.Mock).mockResolvedValue({ items: [] });
      });

      it("creates query builder with proper params", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransfer");
      });

      it("selects address transfers number", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.select).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.select).toHaveBeenCalledWith("addressTransfer.number");
      });

      it("joins transfer records and token records", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
          "addressTransfer.transfer",
          "transfer"
        );
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
      });

      it("filters address transfers using specified findOptions", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.where).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.where).toHaveBeenCalledWith({
          address: "address",
        });
      });

      it("orders address transfers by timestamp DESC and logIndex ASC", async () => {
        await service.findAll(filterOptions, pagingOptions);
        expect(addressTransfersQueryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.orderBy).toHaveBeenCalledWith("addressTransfer.timestamp", "DESC");
        expect(addressTransfersQueryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("addressTransfer.logIndex", "ASC");
      });

      it("returns paginated result with transfers records", async () => {
        const transfers = [mock<Transfer>({ logIndex: 0 }), mock<Transfer>({ logIndex: 1 })];
        const paginationResult = mock<Pagination<AddressTransfer, IPaginationMeta>>({
          items: [
            {
              transfer: transfers[0],
            },
            {
              transfer: transfers[1],
            },
          ],
        });
        (utils.paginate as jest.Mock).mockResolvedValue(paginationResult);
        const result = await service.findAll(filterOptions, pagingOptions);
        expect(utils.paginate).toBeCalledTimes(1);
        expect(utils.paginate).toBeCalledWith(addressTransfersQueryBuilderMock, pagingOptions);
        expect(result).toStrictEqual({ ...paginationResult, items: transfers });
      });
    });
  });

  describe("findTokenTransfers", () => {
    let queryBuilderMock;
    let filterOptions: FilterTokenTransfersOptions;
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
        };
      });

      it("throws an error if token address filter is not specified", async () => {
        await expect(service.findTokenTransfers()).rejects.toThrowError(
          new BadRequestException("Error! Missing address or contract address")
        );
      });

      it("creates query builder with proper params", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      describe("when token type is ERC20", () => {
        it("adds tokenAddress filter", async () => {
          await service.findTokenTransfers(filterOptions);
          expect(queryBuilderMock.where).toBeCalledTimes(1);
          expect(queryBuilderMock.where).toHaveBeenCalledWith({
            tokenAddress: filterOptions.tokenAddress,
          });
        });
      });

      describe("when token type is ERC721", () => {
        it("adds tokenAddress filter", async () => {
          await service.findTokenTransfers({
            ...filterOptions,
            tokenType: TokenType.ERC721,
          });
          expect(queryBuilderMock.where).toBeCalledTimes(1);
          expect(queryBuilderMock.where).toHaveBeenCalledWith({
            tokenAddress: "tokenAddress",
          });
        });
      });

      it("joins token records to the transfers", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
        expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
      });

      it("joins transactions and transaction receipts records to the transfers", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledTimes(2);
        expect(queryBuilderMock.addSelect).toHaveBeenCalledTimes(2);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transaction.nonce",
          "transaction.blockHash",
          "transaction.transactionIndex",
          "transaction.gasLimit",
          "transaction.gasPrice",
          "transaction.data",
          "transaction.fee",
          "transaction.l1BatchNumber",
          "transaction.type",
        ]);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.cumulativeGasUsed",
        ]);
      });

      it("adds start block filter when startBlock is specified", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          startBlock: 10,
        });
        expect(queryBuilderMock.andWhere).toBeCalledTimes(1);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("adds end block filter when endBlock is specified", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          endBlock: 10,
        });
        expect(queryBuilderMock.andWhere).toBeCalledTimes(1);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("sorts by descending order by default", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          sort: SortingOrder.Asc,
        });
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "ASC");
      });

      it("sets offset and limit", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          page: 2,
          offset: 100,
        });
        expect(queryBuilderMock.offset).toBeCalledTimes(1);
        expect(queryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(queryBuilderMock.limit).toBeCalledTimes(1);
        expect(queryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("executes query and returns transfers list", async () => {
        jest.spyOn(queryBuilderMock, "getMany").mockResolvedValue([]);
        const result = await service.findTokenTransfers(filterOptions);
        expect(result).toEqual([]);
        expect(queryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });

    describe("when address filter options is specified", () => {
      beforeEach(() => {
        filterOptions = {
          address: "address",
        };
        jest.spyOn(addressTransfersQueryBuilderMock, "getMany").mockResolvedValue([
          {
            transfer: { blockNumber: 10 },
          },
        ]);
      });

      it("creates query builder with proper params", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransfer");
      });

      describe("when token type is ERC20", () => {
        it("adds address and ERC20 filter", async () => {
          await service.findTokenTransfers(filterOptions);
          expect(addressTransfersQueryBuilderMock.where).toBeCalledTimes(1);
          expect(addressTransfersQueryBuilderMock.where).toHaveBeenCalledWith({
            address: filterOptions.address,
          });
          expect(addressTransfersQueryBuilderMock.andWhere).toBeCalledTimes(1);
          expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith(
            `"addressTransfer"."tokenType" = :tokenType`,
            {
              tokenType: TokenType.ERC20,
            }
          );
        });
      });

      describe("when token type is ERC721", () => {
        it("adds ERC721 filter", async () => {
          await service.findTokenTransfers({
            ...filterOptions,
            tokenType: TokenType.ERC721,
          });
          expect(addressTransfersQueryBuilderMock.where).toBeCalledTimes(1);
          expect(addressTransfersQueryBuilderMock.where).toHaveBeenCalledWith({
            address: filterOptions.address,
          });
          expect(addressTransfersQueryBuilderMock.andWhere).toBeCalledTimes(1);
          expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith(
            `"addressTransfer"."tokenType" = :tokenType`,
            {
              tokenType: TokenType.ERC721,
            }
          );
        });
      });

      describe("when token address is specified", () => {
        it("adds token address filter", async () => {
          await service.findTokenTransfers({
            ...filterOptions,
            tokenAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
          });
          expect(addressTransfersQueryBuilderMock.andWhere).toBeCalledTimes(1);
          expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith(
            `"addressTransfer"."tokenAddress" = :tokenAddress`,
            {
              tokenAddress: normalizeAddressTransformer.to("0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E"),
            }
          );
        });
      });

      it("joins transfers and tokens records to the address transfers", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
          "addressTransfer.transfer",
          "transfer"
        );
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith("transfer.token", "token");
      });

      it("joins transactions and transaction receipts records to the transfers", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.leftJoin).toBeCalledTimes(2);
        expect(addressTransfersQueryBuilderMock.addSelect).toBeCalledTimes(2);
        expect(addressTransfersQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(addressTransfersQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transaction.nonce",
          "transaction.blockHash",
          "transaction.transactionIndex",
          "transaction.gasLimit",
          "transaction.gasPrice",
          "transaction.data",
          "transaction.fee",
          "transaction.l1BatchNumber",
          "transaction.type",
        ]);
        expect(addressTransfersQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
        expect(addressTransfersQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.cumulativeGasUsed",
        ]);
      });

      it("adds start block filter when startBlock is specified", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          startBlock: 10,
        });
        expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("adds end block filter when endBlock is specified", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          endBlock: 10,
        });
        expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("sorts by descending order by default", async () => {
        await service.findTokenTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "DESC");
        expect(addressTransfersQueryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("addressTransfer.logIndex", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          sort: SortingOrder.Asc,
        });
        expect(addressTransfersQueryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "ASC");
        expect(addressTransfersQueryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("addressTransfer.logIndex", "ASC");
      });

      it("sets offset and limit", async () => {
        await service.findTokenTransfers({
          ...filterOptions,
          page: 2,
          offset: 100,
        });
        expect(addressTransfersQueryBuilderMock.offset).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(addressTransfersQueryBuilderMock.limit).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("executes query and returns transfers list", async () => {
        const result = await service.findTokenTransfers(filterOptions);
        expect(result).toEqual([
          {
            blockNumber: 10,
          },
        ]);
        expect(addressTransfersQueryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });
  });

  describe("findInternalTransfers", () => {
    let queryBuilderMock;
    let filterOptions: FilterInternalTransfersOptions;
    let addressTransfersQueryBuilderMock;

    beforeEach(() => {
      queryBuilderMock = mock<typeorm.SelectQueryBuilder<Transfer>>();
      addressTransfersQueryBuilderMock = mock<typeorm.SelectQueryBuilder<AddressTransfer>>();
      (transferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilderMock);
      (addressTransferRepositoryMock.createQueryBuilder as jest.Mock).mockReturnValue(addressTransfersQueryBuilderMock);
    });

    describe("when address filter options is not specified", () => {
      beforeEach(() => {
        filterOptions = {};
      });

      it("creates query builder with proper params", async () => {
        await service.findInternalTransfers();
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(transferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("transfer");
      });

      describe("when transaction hash filter is specified", () => {
        it("adds transaction hash filter", async () => {
          await service.findInternalTransfers({
            ...filterOptions,
            transactionHash: "txhash",
          });
          expect(queryBuilderMock.where).toBeCalledTimes(1);
          expect(queryBuilderMock.where).toHaveBeenCalledWith({
            transactionHash: "txhash",
            isInternal: true,
          });
        });
      });

      describe("when transaction hash filter is not specified", () => {
        it("does not add transaction hash filter", async () => {
          await service.findInternalTransfers(filterOptions);
          expect(queryBuilderMock.where).toBeCalledTimes(1);
          expect(queryBuilderMock.where).toHaveBeenCalledWith({
            isInternal: true,
          });
        });
      });

      it("joins transactions and transaction receipts records to the transfers", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(queryBuilderMock.leftJoin).toBeCalledTimes(2);
        expect(queryBuilderMock.addSelect).toBeCalledTimes(2);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transaction.receiptStatus",
          "transaction.gasLimit",
          "transaction.fee",
          "transaction.l1BatchNumber",
          "transaction.type",
        ]);
        expect(queryBuilderMock.leftJoin).toHaveBeenCalledWith("transaction.transactionReceipt", "transactionReceipt");
        expect(queryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("adds start block filter when startBlock is specified", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          startBlock: 10,
        });
        expect(queryBuilderMock.andWhere).toBeCalledTimes(1);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("adds end block filter when endBlock is specified", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          endBlock: 10,
        });
        expect(queryBuilderMock.andWhere).toBeCalledTimes(1);
        expect(queryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("sorts by descending order by default", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "DESC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          sort: SortingOrder.Asc,
        });
        expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.orderBy).toHaveBeenCalledWith("transfer.blockNumber", "ASC");
        expect(queryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(queryBuilderMock.addOrderBy).toHaveBeenCalledWith("transfer.logIndex", "ASC");
      });

      it("sets offset and limit", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          page: 2,
          offset: 100,
        });
        expect(queryBuilderMock.offset).toBeCalledTimes(1);
        expect(queryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(queryBuilderMock.limit).toBeCalledTimes(1);
        expect(queryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("executes query and returns transfers list", async () => {
        jest.spyOn(queryBuilderMock, "getMany").mockResolvedValue([]);
        const result = await service.findInternalTransfers(filterOptions);
        expect(result).toEqual([]);
        expect(queryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });

    describe("when address filter option is specified", () => {
      beforeEach(() => {
        filterOptions = {
          address: "address",
        };
        jest.spyOn(addressTransfersQueryBuilderMock, "getMany").mockResolvedValue([
          {
            transfer: { blockNumber: 10 },
          },
        ]);
      });

      it("creates query builder with proper params", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(addressTransferRepositoryMock.createQueryBuilder).toHaveBeenCalledWith("addressTransfer");
      });

      it("adds address filter", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.where).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.where).toHaveBeenCalledWith({
          address: filterOptions.address,
          isInternal: true,
        });
      });

      it("joins transfers records to the address transfers", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
          "addressTransfer.transfer",
          "transfer"
        );
      });

      it("joins transactions and transaction receipts records to the transfers", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.leftJoin).toBeCalledTimes(2);
        expect(addressTransfersQueryBuilderMock.addSelect).toBeCalledTimes(2);
        expect(addressTransfersQueryBuilderMock.leftJoin).toHaveBeenCalledWith("transfer.transaction", "transaction");
        expect(addressTransfersQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transaction.receiptStatus",
          "transaction.gasLimit",
          "transaction.fee",
          "transaction.l1BatchNumber",
          "transaction.type",
        ]);
        expect(addressTransfersQueryBuilderMock.leftJoin).toHaveBeenCalledWith(
          "transaction.transactionReceipt",
          "transactionReceipt"
        );
        expect(addressTransfersQueryBuilderMock.addSelect).toHaveBeenCalledWith([
          "transactionReceipt.gasUsed",
          "transactionReceipt.contractAddress",
        ]);
      });

      it("adds start block filter when startBlock is specified", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          startBlock: 10,
        });
        expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.MoreThanOrEqual(10),
        });
      });

      it("adds end block filter when endBlock is specified", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          endBlock: 10,
        });
        expect(addressTransfersQueryBuilderMock.andWhere).toHaveBeenCalledWith({
          blockNumber: typeorm.LessThanOrEqual(10),
        });
      });

      it("sorts by descending order by default", async () => {
        await service.findInternalTransfers(filterOptions);
        expect(addressTransfersQueryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "DESC");
        expect(addressTransfersQueryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("addressTransfer.logIndex", "DESC");
      });

      it("sorts by ascending order if specified", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          sort: SortingOrder.Asc,
        });
        expect(addressTransfersQueryBuilderMock.orderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.orderBy).toHaveBeenCalledWith("addressTransfer.blockNumber", "ASC");
        expect(addressTransfersQueryBuilderMock.addOrderBy).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.addOrderBy).toHaveBeenCalledWith("addressTransfer.logIndex", "ASC");
      });

      it("sets offset and limit", async () => {
        await service.findInternalTransfers({
          ...filterOptions,
          page: 2,
          offset: 100,
        });
        expect(addressTransfersQueryBuilderMock.offset).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.offset).toHaveBeenCalledWith(100);
        expect(addressTransfersQueryBuilderMock.limit).toBeCalledTimes(1);
        expect(addressTransfersQueryBuilderMock.limit).toHaveBeenCalledWith(100);
      });

      it("executes query and returns transfers list", async () => {
        const result = await service.findInternalTransfers(filterOptions);
        expect(result).toEqual([
          {
            blockNumber: 10,
          },
        ]);
        expect(addressTransfersQueryBuilderMock.getMany).toBeCalledTimes(1);
      });
    });
  });
});
