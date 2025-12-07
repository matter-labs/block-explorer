import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { InternalTransaction } from "./entities/internalTransaction.entity";
import { normalizeAddressTransformer } from "../common/transformers/normalizeAddress.transformer";

export interface FindInternalTransactionsOptions {
  address?: string;
  transactionHash?: string;
  startBlock?: number;
  endBlock?: number;
  page?: number;
  offset?: number;
  sort?: string;
}

@Injectable()
export class InternalTransactionService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(InternalTransaction)
    private readonly internalTransactionRepository: Repository<InternalTransaction>
  ) {
    this.logger = new Logger(InternalTransactionService.name);
  }

  /**
   * Find internal transactions by address with differential filtering
   * EOA: only value > 0
   * Contract: all operations
   */
  public async findByAddress(options: FindInternalTransactionsOptions): Promise<InternalTransaction[]> {
    const { address, transactionHash, startBlock, endBlock, page = 1, offset = 10, sort = "desc" } = options;

    const queryBuilder = this.createBaseQuery();

    // Filter by address (from OR to)
    if (address) {
      const normalizedAddress = normalizeAddressTransformer.to(address);
      queryBuilder.andWhere("(internalTransaction.from = :address OR internalTransaction.to = :address)", {
        address: normalizedAddress,
      });

      // Determine if address is a contract by checking if it has bytecode
      try {
        const addressRecord = await this.internalTransactionRepository.manager.query(
          `SELECT bytecode FROM addresses WHERE address = $1 LIMIT 1`,
          [normalizedAddress]
        );
        const isContract =
          addressRecord && addressRecord.length > 0 && addressRecord[0].bytecode && addressRecord[0].bytecode !== "0x";

        // For EOA addresses: only show value-moving transactions
        if (!isContract) {
          queryBuilder.andWhere("internalTransaction.value > :zero", { zero: "0" });
        }
        // For contracts: show all operations (no additional filter)
      } catch (error) {
        // If we can't determine, default to showing all (safer for contracts)
        this.logger.warn(
          `Could not determine contract status for address ${address}, showing all internal transactions`
        );
      }
    }

    // Filter by transaction hash
    if (transactionHash) {
      const normalizedHash = normalizeAddressTransformer.to(transactionHash);
      queryBuilder.andWhere("internalTransaction.transactionHash = :transactionHash", {
        transactionHash: normalizedHash,
      });
    }

    // Filter by block range
    if (startBlock !== undefined) {
      queryBuilder.andWhere("internalTransaction.blockNumber >= :startBlock", { startBlock });
    }
    if (endBlock !== undefined) {
      queryBuilder.andWhere("internalTransaction.blockNumber <= :endBlock", { endBlock });
    }

    // Sorting: blockNumber DESC, traceIndex ASC for proper flow
    const sortOrder = sort.toUpperCase() === "ASC" ? "ASC" : "DESC";
    queryBuilder
      .orderBy("internalTransaction.blockNumber", sortOrder)
      .addOrderBy("internalTransaction.traceIndex", "ASC");

    // Pagination
    const limit = Math.min(offset, 10000);
    queryBuilder.skip((page - 1) * limit).take(limit);

    return await queryBuilder.getMany();
  }

  /**
   * Find internal transactions by transaction hash only
   */
  public async findByTransactionHash(transactionHash: string): Promise<InternalTransaction[]> {
    return this.findByAddress({ transactionHash });
  }

  private createBaseQuery(): SelectQueryBuilder<InternalTransaction> {
    return this.internalTransactionRepository
      .createQueryBuilder("internalTransaction")
      .leftJoinAndSelect("internalTransaction.transaction", "transaction")
      .leftJoinAndSelect("internalTransaction.block", "block");
  }
}
