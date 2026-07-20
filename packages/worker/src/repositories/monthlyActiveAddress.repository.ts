import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { MonthlyActiveAddress } from "../entities";

export interface ProcessTransactionsBatchCursor {
  lastBlockNumber: number;
  lastRecordNumber: number;
}

export interface ProcessTransactionsBatchResult {
  processed: number;
  newLastBlockNumber: number;
  newLastRecordNumber: number;
}

@Injectable()
export class MonthlyActiveAddressRepository extends BaseRepository<MonthlyActiveAddress> {
  public constructor(unitOfWork: UnitOfWork) {
    super(MonthlyActiveAddress, unitOfWork);
  }

  // Single statement that atomically processes a batch of transactions and advances the cursor, with the following steps:
  //   1. Read up to :limit new transactions after the cursor and up to lastReadyBlockNumber
  //   2. Dedupe by (month, address) keeping the earliest block (DISTINCT ON)
  //   3. Insert into monthlyActiveAddresses, skipping duplicates
  //   4. Increment monthlyActiveAddressCounts for each newly-inserted (month, address)
  //   5. Advance the cursor in counterStates
  //   6. Cleanup monthlyActiveAddresses: keep only the cursor's month + the 2 preceding months
  //   7. Return how many transactions were processed + the new cursor
  public async processTransactionsBatch(
    cursor: ProcessTransactionsBatchCursor,
    lastReadyBlockNumber: number,
    limit: number,
    tableName: string
  ): Promise<ProcessTransactionsBatchResult> {
    const sql = `
      WITH new_txs AS (
        SELECT
          t."number",
          t."blockNumber",
          t."from",
          date_trunc('month', t."receivedAt" AT TIME ZONE 'UTC')::date AS "month"
        FROM "transactions" t
        WHERE (t."blockNumber", t."number") > ($1, $2)
          AND t."blockNumber" <= $3
        ORDER BY t."blockNumber" ASC, t."number" ASC
        LIMIT $4
      ),
      last_row AS (
        SELECT "blockNumber", "number", "month"
        FROM new_txs
        ORDER BY "blockNumber" DESC, "number" DESC
        LIMIT 1
      ),
      deduped AS (
        SELECT DISTINCT ON ("month", "from")
          "month", "from", "blockNumber"
        FROM new_txs
        ORDER BY "month", "from", "blockNumber" ASC, "number" ASC
      ),
      inserted AS (
        INSERT INTO "monthlyActiveAddresses" ("month", "address", "blockNumber")
        SELECT "month", "from", "blockNumber" FROM deduped
        ON CONFLICT ("month", "address") DO NOTHING
        RETURNING "month"
      ),
      per_month AS (
        SELECT "month", COUNT(*)::bigint AS new_count
        FROM inserted
        GROUP BY "month"
      ),
      count_upsert AS (
        INSERT INTO "monthlyActiveAddressCounts" ("month", "count")
        SELECT "month", new_count FROM per_month
        ON CONFLICT ("month") DO UPDATE
          SET "count" = "monthlyActiveAddressCounts"."count" + EXCLUDED."count",
              "updatedAt" = now()
      ),
      cursor_upsert AS (
        INSERT INTO "counterStates" ("tableName", "lastProcessedRecordNumber", "lastProcessedBlockNumber")
        SELECT $5, "number", "blockNumber" FROM last_row
        ON CONFLICT ("tableName") DO UPDATE
          SET "lastProcessedRecordNumber" = EXCLUDED."lastProcessedRecordNumber",
              "lastProcessedBlockNumber" = EXCLUDED."lastProcessedBlockNumber",
              "updatedAt" = now()
      ),
      cleanup AS (
        DELETE FROM "monthlyActiveAddresses"
        WHERE "month" < ((SELECT "month" FROM last_row) - interval '2 months')::date
      )
      SELECT
        (SELECT COUNT(*)::int FROM new_txs) AS "processed",
        COALESCE((SELECT "blockNumber" FROM last_row), $1) AS "newLastBlockNumber",
        COALESCE((SELECT "number" FROM last_row), $2) AS "newLastRecordNumber"
    `;

    const transactionManager = this.unitOfWork.getTransactionManager();
    const [row] = await transactionManager.query(sql, [
      cursor.lastBlockNumber,
      cursor.lastRecordNumber,
      lastReadyBlockNumber,
      limit,
      tableName,
    ]);
    return {
      processed: Number(row.processed),
      newLastBlockNumber: Number(row.newLastBlockNumber),
      newLastRecordNumber: Number(row.newLastRecordNumber),
    };
  }

  // Reverse for reorgs in a single statement:
  //   1. Delete monthlyActiveAddresses rows whose first appearance was in a now-reverted block
  //   2. Decrement monthlyActiveAddressCounts by the removed counts per month
  //   3. Rewind the counterStates cursor to the last valid (blockNumber, number) <= lastCorrect.
  //      We only rewind when the persisted cursor is past the revert point.
  public async revertAboveBlockNumber(blockNumber: number, tableName: string): Promise<void> {
    const sql = `
      WITH deleted AS (
        DELETE FROM "monthlyActiveAddresses"
        WHERE "blockNumber" > $1
        RETURNING "month"
      ),
      per_month AS (
        SELECT "month", COUNT(*)::bigint AS removed FROM deleted GROUP BY "month"
      ),
      count_update AS (
        UPDATE "monthlyActiveAddressCounts" c
        SET "count" = c."count" - p.removed,
            "updatedAt" = now()
        FROM per_month p
        WHERE c."month" = p."month"
      ),
      last_valid AS (
        SELECT "blockNumber", "number"
        FROM "transactions"
        WHERE "blockNumber" <= $1
        ORDER BY "blockNumber" DESC, "number" DESC
        LIMIT 1
      )
      UPDATE "counterStates"
      SET
        "lastProcessedBlockNumber" = COALESCE((SELECT "blockNumber" FROM last_valid), -1),
        "lastProcessedRecordNumber" = COALESCE((SELECT "number" FROM last_valid), -1),
        "updatedAt" = now()
      WHERE "tableName" = $2
        AND "lastProcessedBlockNumber" > $1
    `;
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.query(sql, [blockNumber, tableName]);
  }
}
