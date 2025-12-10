import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, MoreThanOrEqual, Repository, SelectQueryBuilder } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { InternalTransaction } from "./entities/internalTransaction.entity";
import { Address } from "../address/address.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";
import { paginate } from "../common/utils";
import { IPaginationOptions } from "../common/types";
import { AddressInternalTransaction } from "./entities/addressInternalTransaction.entity";

export interface FilterInternalTransactionsOptions {
  address?: string;
  transactionHash?: string;
  startBlock?: number;
  endBlock?: number;
  sort?: string;
}

@Injectable()
export class InternalTransactionService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(InternalTransaction)
    private readonly internalTransactionRepository: Repository<InternalTransaction>,
    @InjectRepository(AddressInternalTransaction)
    private readonly addressInternalTransactionRepository: Repository<AddressInternalTransaction>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>
  ) {
    this.logger = new Logger(InternalTransactionService.name);
  }

  /**
   * Find internal transactions with filtering and pagination
   */
  public async findAll(
    filterOptions: FilterInternalTransactionsOptions,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<InternalTransaction>> {
    if (filterOptions.address) {
      const normalizedAddress = normalizeAddressTransformer.to(filterOptions.address);
      const queryBuilder = this.addressInternalTransactionRepository.createQueryBuilder("addressInternalTransaction");
      queryBuilder.select("addressInternalTransaction.number");
      queryBuilder.leftJoinAndSelect("addressInternalTransaction.internalTransaction", "internalTransaction");
      queryBuilder.leftJoinAndSelect("internalTransaction.transaction", "transaction");
      queryBuilder.leftJoinAndSelect("internalTransaction.block", "block");
      queryBuilder.where({ address: normalizedAddress });

      if (filterOptions.transactionHash) {
        const normalizedHash = normalizeAddressTransformer.to(filterOptions.transactionHash);
        queryBuilder.andWhere("addressInternalTransaction.transactionHash = :transactionHash", {
          transactionHash: normalizedHash,
        });
      }
      if (filterOptions.startBlock !== undefined) {
        queryBuilder.andWhere({
          blockNumber: MoreThanOrEqual(filterOptions.startBlock),
        });
      }
      if (filterOptions.endBlock !== undefined) {
        queryBuilder.andWhere({
          blockNumber: LessThanOrEqual(filterOptions.endBlock),
        });
      }

      // Determine if address is a contract by checking if it has bytecode
      try {
        const addressRecord = await this.addressRepository.findOne({
          where: { address: normalizedAddress },
          select: { bytecode: true },
        });
        const isContract = addressRecord?.bytecode && addressRecord.bytecode !== "0x";

        if (!isContract) {
          queryBuilder.andWhere("internalTransaction.value > :zero", { zero: "0" });
        }
      } catch (error) {
        this.logger.warn(
          `Could not determine contract status for address ${filterOptions.address}, showing all internal transactions`
        );
      }

      const sortOrder = filterOptions.sort?.toUpperCase() === "ASC" ? "ASC" : "DESC";
      queryBuilder.orderBy("addressInternalTransaction.blockNumber", sortOrder);
      queryBuilder.addOrderBy("addressInternalTransaction.traceIndex", "ASC");

      const addressInternalTransactions = await paginate<AddressInternalTransaction>(queryBuilder, paginationOptions);
      return {
        ...addressInternalTransactions,
        items: addressInternalTransactions.items.map((item) => item.internalTransaction),
      };
    }

    const queryBuilder = this.createBaseQuery();
    // filter by transaction hash
    // filter by transaction hash
    if (filterOptions.transactionHash) {
      const normalizedHash = normalizeAddressTransformer.to(filterOptions.transactionHash);
      queryBuilder.andWhere("internalTransaction.transactionHash = :transactionHash", {
        transactionHash: normalizedHash,
      });
    }
    // block range filtering
    if (filterOptions.startBlock !== undefined) {
      queryBuilder.andWhere("internalTransaction.blockNumber >= :startBlock", { startBlock: filterOptions.startBlock });
    }
    if (filterOptions.endBlock !== undefined) {
      queryBuilder.andWhere("internalTransaction.blockNumber <= :endBlock", { endBlock: filterOptions.endBlock });
    }
    // sorting
    const sortOrder = filterOptions.sort?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    queryBuilder
      .orderBy("internalTransaction.blockNumber", sortOrder)
      .addOrderBy("internalTransaction.traceIndex", "ASC");

    return await paginate<InternalTransaction>(queryBuilder, paginationOptions);
  }

  /**
   * Find internal transactions by transaction hash
   */
  public async findByTransactionHash(transactionHash: string): Promise<InternalTransaction[]> {
    return (await this.findAll({ transactionHash }, { page: 1, limit: 10 })).items;
  }

  private createBaseQuery(): SelectQueryBuilder<InternalTransaction> {
    return this.internalTransactionRepository
      .createQueryBuilder("internalTransaction")
      .leftJoinAndSelect("internalTransaction.transaction", "transaction")
      .leftJoinAndSelect("internalTransaction.block", "block");
  }
}
