import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOperator, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { IPaginationOptions, SortingOrder } from "../common/types";
import { Transfer, TransferType } from "./transfer.entity";
import { TokenType } from "../token/token.entity";
import { AddressTransfer } from "./addressTransfer.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

export interface FilterTransfersOptions {
  tokenAddress?: string;
  transactionHash?: string;
  address?: string;
  timestamp?: FindOperator<Date>;
  isFeeOrRefund?: boolean;
  type?: TransferType;
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
    private readonly addressTransferRepository: Repository<AddressTransfer>
  ) {}

  public async findAll(
    filterOptions: FilterTransfersOptions = {},
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Transfer>> {
    if (filterOptions.address) {
      const queryBuilder = this.addressTransferRepository.createQueryBuilder("addressTransfer");
      queryBuilder.select("addressTransfer.number");
      queryBuilder.leftJoinAndSelect("addressTransfer.transfer", "transfer");
      queryBuilder.leftJoinAndSelect("transfer.token", "token");
      queryBuilder.where(filterOptions);
      queryBuilder.orderBy("addressTransfer.timestamp", "DESC");
      queryBuilder.addOrderBy("addressTransfer.logIndex", "ASC");
      const addressTransfers = await paginate<AddressTransfer>(queryBuilder, paginationOptions);
      return {
        ...addressTransfers,
        items: addressTransfers.items.map((item) => item.transfer),
      };
    } else {
      const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
      queryBuilder.where(filterOptions);
      queryBuilder.leftJoinAndSelect("transfer.token", "token");
      queryBuilder.orderBy("transfer.timestamp", "DESC");
      queryBuilder.addOrderBy("transfer.logIndex", "ASC");
      return await paginate<Transfer>(queryBuilder, paginationOptions);
    }
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
    if (address) {
      const queryBuilder = this.addressTransferRepository.createQueryBuilder("addressTransfer");
      queryBuilder.select("addressTransfer.number");
      queryBuilder.leftJoinAndSelect("addressTransfer.transfer", "transfer");
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
        "transaction.l1BatchNumber",
        "transaction.type",
      ]);
      queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
      queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.cumulativeGasUsed"]);
      queryBuilder.where({
        address,
      });
      if (tokenAddress) {
        queryBuilder.andWhere(`"addressTransfer"."tokenAddress" = :tokenAddress`, {
          tokenAddress: normalizeAddressTransformer.to(tokenAddress),
        });
      } else {
        queryBuilder.andWhere(`"addressTransfer"."tokenType" = :tokenType`, {
          tokenType,
        });
      }
      if (startBlock !== undefined) {
        queryBuilder.andWhere({
          blockNumber: MoreThanOrEqual(startBlock),
        });
      }
      if (endBlock !== undefined) {
        queryBuilder.andWhere({
          blockNumber: LessThanOrEqual(endBlock),
        });
      }
      const order = sort === SortingOrder.Asc ? "ASC" : "DESC";
      queryBuilder.orderBy("addressTransfer.blockNumber", order);
      queryBuilder.addOrderBy("addressTransfer.logIndex", order);
      queryBuilder.offset((page - 1) * offset);
      queryBuilder.limit(offset);
      const addressTransfers = await queryBuilder.getMany();
      return addressTransfers.map((item) => item.transfer);
    }
    if (!tokenAddress) {
      throw new BadRequestException("Error! Missing address or contract address");
    }
    const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
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
      "transaction.l1BatchNumber",
      "transaction.type",
    ]);
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.cumulativeGasUsed"]);
    queryBuilder.where({
      tokenAddress,
    });
    if (startBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: MoreThanOrEqual(startBlock),
      });
    }
    if (endBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: LessThanOrEqual(endBlock),
      });
    }
    const order = sort === SortingOrder.Asc ? "ASC" : "DESC";
    queryBuilder.orderBy("transfer.blockNumber", order);
    queryBuilder.addOrderBy("transfer.logIndex", order);
    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    const transfers = await queryBuilder.getMany();
    return transfers;
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
    if (address) {
      const queryBuilder = this.addressTransferRepository.createQueryBuilder("addressTransfer");
      queryBuilder.select("addressTransfer.number");
      queryBuilder.leftJoinAndSelect("addressTransfer.transfer", "transfer");
      queryBuilder.leftJoin("transfer.transaction", "transaction");
      queryBuilder.addSelect([
        "transaction.receiptStatus",
        "transaction.gasLimit",
        "transaction.fee",
        "transaction.l1BatchNumber",
        "transaction.type",
      ]);
      queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
      queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
      queryBuilder.where({
        address,
        isInternal: true,
      });
      if (startBlock !== undefined) {
        queryBuilder.andWhere({
          blockNumber: MoreThanOrEqual(startBlock),
        });
      }
      if (endBlock !== undefined) {
        queryBuilder.andWhere({
          blockNumber: LessThanOrEqual(endBlock),
        });
      }
      const order = sort === SortingOrder.Asc ? "ASC" : "DESC";
      queryBuilder.orderBy("addressTransfer.blockNumber", order);
      queryBuilder.addOrderBy("addressTransfer.logIndex", order);
      queryBuilder.offset((page - 1) * offset);
      queryBuilder.limit(offset);
      const addressTransfers = await queryBuilder.getMany();
      return addressTransfers.map((item) => item.transfer);
    }
    const queryBuilder = this.transferRepository.createQueryBuilder("transfer");
    queryBuilder.leftJoin("transfer.transaction", "transaction");
    queryBuilder.addSelect([
      "transaction.receiptStatus",
      "transaction.gasLimit",
      "transaction.fee",
      "transaction.l1BatchNumber",
      "transaction.type",
    ]);
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transactionReceipt.gasUsed", "transactionReceipt.contractAddress"]);
    queryBuilder.where({
      ...(transactionHash && {
        transactionHash,
      }),
      isInternal: true,
    });
    if (startBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: MoreThanOrEqual(startBlock),
      });
    }
    if (endBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: LessThanOrEqual(endBlock),
      });
    }
    const order = sort === SortingOrder.Asc ? "ASC" : "DESC";
    queryBuilder.orderBy("transfer.blockNumber", order);
    queryBuilder.addOrderBy("transfer.logIndex", order);
    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    const transfers = await queryBuilder.getMany();
    return transfers;
  }
}
