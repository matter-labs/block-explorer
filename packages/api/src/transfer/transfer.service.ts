import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  FindOperator,
  MoreThanOrEqual,
  LessThanOrEqual,
  Brackets,
  ObjectLiteral,
  SelectQueryBuilder,
} from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate, computeFromToMinMax, copyOrderBy } from "../common/utils";
import { IPaginationOptions, SortingOrder } from "../common/types";
import { Transfer, TransferType } from "./transfer.entity";
import { TokenType } from "../token/token.entity";
import { AddressTransfer } from "./addressTransfer.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { IndexerStateService } from "../indexerState/indexerState.service";

export interface FilterTransfersOptions {
  tokenAddress?: string;
  transactionHash?: string;
  address?: string;
  blockNumber?: number | FindOperator<number>;
  isFeeOrRefund?: boolean;
  type?: TransferType;
  visibleBy?: string;
}

export interface FilterTokenTransfersOptions {
  tokenAddress?: string;
  tokenType?: TokenType;
  address?: string;
  startBlock?: number;
  endBlock?: number;
  page?: number;
  offset?: number;
  sort?: SortingOrder;
}

export interface FilterInternalTransfersOptions {
  address?: string;
  transactionHash?: string;
  startBlock?: number;
  endBlock?: number;
  page?: number;
  offset?: number;
  sort?: SortingOrder;
}

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(AddressTransfer)
    private readonly addressTransferRepository: Repository<AddressTransfer>,
    private readonly indexerStateService: IndexerStateService
  ) {}

  public async findAll(
    filterOptions: FilterTransfersOptions = {},
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transfer>> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const { visibleBy, ...basicOptions } = filterOptions;

    if (visibleBy) {
      const { address, ...options } = basicOptions;
      if (address && address !== visibleBy) {
        // two-party: transfers between address and visibleBy
        const { fromToMin, fromToMax } = computeFromToMinMax(address, visibleBy);
        const innerQb = this.transferRepository.createQueryBuilder("transfer");
        innerQb.select("transfer.number", "number");
        innerQb.where({ ...options, fromToMin, fromToMax });
        innerQb.andWhere("transfer.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
        innerQb.orderBy("transfer.blockNumber", "DESC");
        innerQb.addOrderBy("transfer.logIndex", "DESC");
        return this.paginateTransfers(innerQb, "number", paginationOptions);
      }
      if (options.transactionHash) {
        // transactionHash is highly selective — OR over a handful of rows is negligible
        const innerQb = this.transferRepository.createQueryBuilder("transfer");
        innerQb.select("transfer.number", "number");
        innerQb.where(options);
        innerQb.andWhere("transfer.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
        innerQb.andWhere(
          new Brackets((qb) => {
            qb.where({ from: visibleBy }).orWhere({ to: visibleBy });
          })
        );
        innerQb.orderBy("transfer.blockNumber", "ASC");
        innerQb.addOrderBy("transfer.logIndex", "ASC");
        return this.paginateTransfers(innerQb, "number", paginationOptions);
      }
      // own transfers: address === visibleBy or no address
      return this.findAddressTransfers({ ...options, address: visibleBy }, paginationOptions, lastReadyBlockNumber);
    }

    if (basicOptions.address) {
      return this.findAddressTransfers(basicOptions, paginationOptions, lastReadyBlockNumber);
    }

    const innerQb = this.transferRepository.createQueryBuilder("transfer");
    innerQb.select("transfer.number", "number");
    innerQb.where(basicOptions);
    innerQb.andWhere("transfer.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    const order = basicOptions.transactionHash ? "ASC" : "DESC";
    innerQb.orderBy("transfer.blockNumber", order);
    innerQb.addOrderBy("transfer.logIndex", order);
    return this.paginateTransfers(innerQb, "number", paginationOptions);
  }

  public async findTokenTransfers({
    tokenAddress,
    address,
    startBlock,
    endBlock,
    tokenType = TokenType.ERC20,
    page = 1,
    offset = 10,
    sort = SortingOrder.Desc,
  }: FilterTokenTransfersOptions = {}): Promise<Transfer[]> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const clampedEndBlock = endBlock !== undefined ? Math.min(endBlock, lastReadyBlockNumber) : lastReadyBlockNumber;
    const order = sort === SortingOrder.Asc ? "ASC" : "DESC";

    if (address) {
      const innerQb = this.addressTransferRepository.createQueryBuilder("addressTransfer");
      innerQb.select("addressTransfer.transferNumber", "transferNumber");
      innerQb.where({ address });
      if (tokenAddress) {
        innerQb.andWhere(`"addressTransfer"."tokenAddress" = :tokenAddress`, {
          tokenAddress: normalizeAddressTransformer.to(tokenAddress),
        });
      } else {
        innerQb.andWhere(`"addressTransfer"."tokenType" = :tokenType`, { tokenType });
      }
      if (startBlock !== undefined) {
        innerQb.andWhere({ blockNumber: MoreThanOrEqual(startBlock) });
      }
      innerQb.andWhere({ blockNumber: LessThanOrEqual(clampedEndBlock) });
      innerQb.orderBy("addressTransfer.blockNumber", order);
      innerQb.addOrderBy("addressTransfer.logIndex", order);
      innerQb.offset((page - 1) * offset);
      innerQb.limit(offset);

      const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
      queryBuilder.innerJoin(
        `(${innerQb.getQuery()})`,
        "_paginated",
        `"_paginated"."transferNumber" = "transfer"."number"`
      );
      queryBuilder.setParameters(innerQb.getParameters());
      queryBuilder.leftJoinAndSelect("transfer.token", "token");
      queryBuilder.leftJoin("transfer.transaction", "transaction");
      queryBuilder.addSelect([
        "transaction.nonce",
        "transaction.blockHash",
        "transaction.transactionIndex",
        "transaction.gasLimit",
        "transaction.gasPrice",
        "transaction.data",
        "transaction.fee",
        "transaction.type",
      ]);
      queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
      queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.cumulativeGasUsed"]);
      queryBuilder.orderBy("transfer.blockNumber", order);
      queryBuilder.addOrderBy("transfer.logIndex", order);
      return await queryBuilder.getMany();
    }
    if (!tokenAddress) {
      throw new BadRequestException("Error! Missing address or contract address");
    }

    const innerQb = this.transferRepository.createQueryBuilder("transfer");
    innerQb.select("transfer.number", "number");
    innerQb.where({ tokenAddress });
    if (startBlock !== undefined) {
      innerQb.andWhere({ blockNumber: MoreThanOrEqual(startBlock) });
    }
    innerQb.andWhere({ blockNumber: LessThanOrEqual(clampedEndBlock) });
    innerQb.orderBy("transfer.blockNumber", order);
    innerQb.addOrderBy("transfer.logIndex", order);
    innerQb.offset((page - 1) * offset);
    innerQb.limit(offset);

    const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
    queryBuilder.innerJoin(`(${innerQb.getQuery()})`, "_paginated", `"_paginated"."number" = "transfer"."number"`);
    queryBuilder.setParameters(innerQb.getParameters());
    queryBuilder.leftJoinAndSelect("transfer.token", "token");
    queryBuilder.leftJoin("transfer.transaction", "transaction");
    queryBuilder.addSelect([
      "transaction.nonce",
      "transaction.blockHash",
      "transaction.transactionIndex",
      "transaction.gasLimit",
      "transaction.gasPrice",
      "transaction.data",
      "transaction.fee",
      "transaction.type",
    ]);
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.cumulativeGasUsed"]);
    queryBuilder.orderBy("transfer.blockNumber", order);
    queryBuilder.addOrderBy("transfer.logIndex", order);
    return await queryBuilder.getMany();
  }

  public async findInternalTransfers({
    address,
    transactionHash,
    startBlock,
    endBlock,
    page = 1,
    offset = 10,
    sort = SortingOrder.Desc,
  }: FilterInternalTransfersOptions = {}): Promise<Transfer[]> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const clampedEndBlock = endBlock !== undefined ? Math.min(endBlock, lastReadyBlockNumber) : lastReadyBlockNumber;
    const order = sort === SortingOrder.Asc ? "ASC" : "DESC";

    if (address) {
      const innerQb = this.addressTransferRepository.createQueryBuilder("addressTransfer");
      innerQb.select("addressTransfer.transferNumber", "transferNumber");
      innerQb.where({ address, isInternal: true });
      if (startBlock !== undefined) {
        innerQb.andWhere({ blockNumber: MoreThanOrEqual(startBlock) });
      }
      innerQb.andWhere({ blockNumber: LessThanOrEqual(clampedEndBlock) });
      innerQb.orderBy("addressTransfer.blockNumber", order);
      innerQb.addOrderBy("addressTransfer.logIndex", order);
      innerQb.offset((page - 1) * offset);
      innerQb.limit(offset);

      const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
      queryBuilder.innerJoin(
        `(${innerQb.getQuery()})`,
        "_paginated",
        `"_paginated"."transferNumber" = "transfer"."number"`
      );
      queryBuilder.setParameters(innerQb.getParameters());
      queryBuilder.leftJoin("transfer.transaction", "transaction");
      queryBuilder.addSelect([
        "transaction.receiptStatus",
        "transaction.gasLimit",
        "transaction.fee",
        "transaction.type",
      ]);
      queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
      queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
      queryBuilder.orderBy("transfer.blockNumber", order);
      queryBuilder.addOrderBy("transfer.logIndex", order);
      return await queryBuilder.getMany();
    }

    const innerQb = this.transferRepository.createQueryBuilder("transfer");
    innerQb.select("transfer.number", "number");
    innerQb.where({
      ...(transactionHash && { transactionHash }),
      isInternal: true,
    });
    if (startBlock !== undefined) {
      innerQb.andWhere({ blockNumber: MoreThanOrEqual(startBlock) });
    }
    innerQb.andWhere({ blockNumber: LessThanOrEqual(clampedEndBlock) });
    innerQb.orderBy("transfer.blockNumber", order);
    innerQb.addOrderBy("transfer.logIndex", order);
    innerQb.offset((page - 1) * offset);
    innerQb.limit(offset);

    const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
    queryBuilder.innerJoin(`(${innerQb.getQuery()})`, "_paginated", `"_paginated"."number" = "transfer"."number"`);
    queryBuilder.setParameters(innerQb.getParameters());
    queryBuilder.leftJoin("transfer.transaction", "transaction");
    queryBuilder.addSelect([
      "transaction.receiptStatus",
      "transaction.gasLimit",
      "transaction.fee",
      "transaction.type",
    ]);
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
    queryBuilder.orderBy("transfer.blockNumber", order);
    queryBuilder.addOrderBy("transfer.logIndex", order);
    return await queryBuilder.getMany();
  }

  private async findAddressTransfers(
    where: ObjectLiteral,
    paginationOptions: IPaginationOptions,
    lastReadyBlockNumber: number
  ): Promise<Pagination<Transfer>> {
    const innerQb = this.addressTransferRepository.createQueryBuilder("at");
    innerQb.select("at.transferNumber", "transferNumber");
    innerQb.where(where);
    innerQb.andWhere("at.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    innerQb.orderBy("at.blockNumber", "DESC");
    innerQb.addOrderBy("at.logIndex", "DESC");
    return this.paginateTransfers(innerQb, "transferNumber", paginationOptions);
  }

  private async paginateTransfers<T>(
    innerQb: SelectQueryBuilder<T>,
    fkColumn: string,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transfer>> {
    return paginate<Transfer>({
      queryBuilder: innerQb as unknown as SelectQueryBuilder<Transfer>,
      options: paginationOptions,
      wrapQuery: async (pagedInnerQb) => {
        const outerQb = this.transferRepository.createQueryBuilder("transfer");
        outerQb.innerJoin(
          `(${pagedInnerQb.getQuery()})`,
          "_paginated",
          `"_paginated"."${fkColumn}" = "transfer"."number"`
        );
        outerQb.setParameters(pagedInnerQb.getParameters());
        outerQb.leftJoinAndSelect("transfer.token", "token");
        copyOrderBy(pagedInnerQb, outerQb, "transfer");
        return outerQb;
      },
    });
  }
}
