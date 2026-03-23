import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisibilityTables1774219097823 implements MigrationInterface {
  name = "AddVisibilityTables1774219097823";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Step 1: Add new columns (nullable initially to allow backfill) ---
    await queryRunner.query(`ALTER TABLE "transactions" ADD "fromToMin" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "fromToMax" bytea`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "fromToMin" bytea`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "fromToMax" bytea`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "transactionFrom" bytea`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "transactionTo" bytea`);

    // --- Step 2: Backfill existing table columns ---
    await queryRunner.query(
      `UPDATE "transactions" SET "fromToMin" = LEAST("from", "to"), "fromToMax" = GREATEST("from", "to")`
    );
    await queryRunner.query(
      `UPDATE "transfers" SET "fromToMin" = LEAST("from", "to"), "fromToMax" = GREATEST("from", "to")`
    );
    await queryRunner.query(
      `UPDATE "logs" l SET "transactionFrom" = t."from", "transactionTo" = t."to" FROM "transactions" t WHERE l."transactionHash" = t."hash"`
    );

    // --- Step 3: Enforce NOT NULL on transfers (from/to are always present) ---
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "fromToMin" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "fromToMax" SET NOT NULL`);

    // --- Step 4: Create new tables ---
    await queryRunner.query(
      `CREATE TABLE "visibleTransactions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "transactionHash" bytea NOT NULL, "visibleBy" bytea NOT NULL, "blockNumber" bigint NOT NULL, "receivedAt" TIMESTAMP NOT NULL, "transactionIndex" integer NOT NULL, CONSTRAINT "PK_dd018176234dcb20644d0ab9621" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(
      `CREATE TABLE "visibleLogs" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "logNumber" bigint NOT NULL, "transactionHash" bytea, "address" bytea NOT NULL, "logIndex" integer NOT NULL, "visibleBy" bytea NOT NULL, "blockNumber" bigint NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_449931e1db3cfd2deff805e0c41" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(
      `CREATE TABLE "addressVisibleTransactions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "transactionHash" bytea NOT NULL, "address" bytea NOT NULL, "visibleBy" bytea NOT NULL, "blockNumber" bigint NOT NULL, "receivedAt" TIMESTAMP NOT NULL, "transactionIndex" integer NOT NULL, CONSTRAINT "PK_ef2be6b4eaa17d0f83e6c5c715d" PRIMARY KEY ("number"))`
    );

    // --- Step 5: Populate new tables (only when prividium with topic visibility is enabled) ---

    const prividiumEnabled = process.env.PRIVIDIUM === "true";
    const topicVisibilityEnabled = process.env.PRIVIDIUM_DISABLE_TX_VISIBILITY_BY_TOPICS !== "true";

    if (prividiumEnabled && topicVisibilityEnabled) {
      // visibleTransactions: one row per (transactionHash, visibleBy) where visibleBy is
      // the sender, receiver, or any address extracted from log topic1-3.
      await queryRunner.query(`
            WITH topic_address_viewers AS (
                SELECT DISTINCT l."transactionHash", substring(topic FROM 13) AS "viewer"
                FROM "logs" l
                CROSS JOIN LATERAL (SELECT unnest(ARRAY[l."topics"[2], l."topics"[3], l."topics"[4]]) AS topic) t
                WHERE l."transactionHash" IS NOT NULL
                  AND topic IS NOT NULL
                  AND octet_length(topic) = 32
                  AND substring(topic FROM 1 FOR 12) = decode('000000000000000000000000', 'hex')
            ),
            all_viewers AS (
                SELECT "hash" AS "transactionHash", "from" AS "viewer" FROM "transactions"
                UNION
                SELECT "hash", "to" FROM "transactions" WHERE "to" IS NOT NULL
                UNION
                SELECT "transactionHash", "viewer" FROM topic_address_viewers
            )
            INSERT INTO "visibleTransactions" ("transactionHash", "visibleBy", "blockNumber", "receivedAt", "transactionIndex")
            SELECT av."transactionHash", av."viewer", t."blockNumber", t."receivedAt", t."transactionIndex"
            FROM all_viewers av
            JOIN "transactions" t ON t."hash" = av."transactionHash"
        `);

      // addressVisibleTransactions: one row per (address, visibleBy) pair where address is
      // a transaction party (from/to) and visibleBy is any viewer, excluding self-pairs.
      await queryRunner.query(`
            WITH topic_address_viewers AS (
                SELECT DISTINCT l."transactionHash", substring(topic FROM 13) AS "viewer"
                FROM "logs" l
                CROSS JOIN LATERAL (SELECT unnest(ARRAY[l."topics"[2], l."topics"[3], l."topics"[4]]) AS topic) t
                WHERE l."transactionHash" IS NOT NULL
                  AND topic IS NOT NULL
                  AND octet_length(topic) = 32
                  AND substring(topic FROM 1 FOR 12) = decode('000000000000000000000000', 'hex')
            ),
            all_viewers AS (
                SELECT "hash" AS "transactionHash", "from" AS "viewer" FROM "transactions"
                UNION
                SELECT "hash", "to" FROM "transactions" WHERE "to" IS NOT NULL
                UNION
                SELECT "transactionHash", "viewer" FROM topic_address_viewers
            ),
            owners AS (
                SELECT "hash" AS "transactionHash", "from" AS "address" FROM "transactions"
                UNION
                SELECT "hash", "to" FROM "transactions" WHERE "to" IS NOT NULL
            )
            INSERT INTO "addressVisibleTransactions" ("transactionHash", "address", "visibleBy", "blockNumber", "receivedAt", "transactionIndex")
            SELECT DISTINCT o."transactionHash", o."address", av."viewer", t."blockNumber", t."receivedAt", t."transactionIndex"
            FROM owners o
            JOIN all_viewers av ON av."transactionHash" = o."transactionHash" AND av."viewer" != o."address"
            JOIN "transactions" t ON t."hash" = o."transactionHash"
        `);

      // visibleLogs: one row per (logNumber, visibleBy) where visibleBy is the transaction
      // sender, receiver, the log's contract address, or an address from log topic1-3.
      await queryRunner.query(`
            WITH log_viewers AS (
                SELECT DISTINCT
                    l."number" AS "logNumber",
                    l."transactionHash",
                    l."address",
                    l."logIndex",
                    l."blockNumber",
                    l."timestamp",
                    v."viewer"
                FROM "logs" l
                CROSS JOIN LATERAL (
                    SELECT l."transactionFrom" AS "viewer" WHERE l."transactionFrom" IS NOT NULL
                    UNION
                    SELECT l."transactionTo" WHERE l."transactionTo" IS NOT NULL
                    UNION
                    SELECT l."address"
                    UNION
                    SELECT substring(topic FROM 13)
                    FROM (SELECT unnest(ARRAY[l."topics"[2], l."topics"[3], l."topics"[4]]) AS topic) t
                    WHERE topic IS NOT NULL
                      AND octet_length(topic) = 32
                      AND substring(topic FROM 1 FOR 12) = decode('000000000000000000000000', 'hex')
                ) v
            )
            INSERT INTO "visibleLogs" ("logNumber", "transactionHash", "address", "logIndex", "visibleBy", "blockNumber", "timestamp")
            SELECT "logNumber", "transactionHash", "address", "logIndex", "viewer", "blockNumber", "timestamp"
            FROM log_viewers
        `);
    } // end if (prividiumEnabled && topicVisibilityEnabled)

    // --- Step 6: Create indexes (after data load for better performance) ---
    await queryRunner.query(
      `CREATE INDEX "IDX_9228143efe55cf142e861bc502" ON "transactions" ("fromToMin", "fromToMax", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c45d488f03a4724a1b8490068c" ON "tokens" ("liquidity", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae784f6b1cd5d7e46d57abb426" ON "transfers" ("fromToMin", "fromToMax", "type", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17cd4abaff93f9d170eecee24f" ON "transfers" ("fromToMin", "fromToMax", "isFeeOrRefund", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_382f446361db1f82055eae989a" ON "logs" ("address", "transactionFrom", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2ed36b20ba87102b821ff555a" ON "addressTransfers" ("address", "tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f9ba40f27ea5b5179e8c45ac2" ON "visibleTransactions" ("transactionHash") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_cb869a1d26d0545f10626bf9eb" ON "visibleTransactions" ("blockNumber") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_c954af638c99003126575112ad" ON "visibleTransactions" ("visibleBy", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_43df0ce809a56d5c2745d7a34d" ON "visibleLogs" ("logNumber") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_8d414a90da6ffce76ac59e28e1" ON "visibleLogs" ("visibleBy", "transactionHash", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8f7413334423b8549171b3c99" ON "visibleLogs" ("visibleBy", "address", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_36f31745cd471591835af79ade" ON "addressVisibleTransactions" ("transactionHash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_392a7e8702c4bbe6926a2bce66" ON "addressVisibleTransactions" ("blockNumber") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1635dac1e1b877b7b2f9f65aef" ON "addressVisibleTransactions" ("address", "visibleBy", "blockNumber", "receivedAt", "transactionIndex") `
    );

    // --- Step 7: Add foreign key constraints ---
    await queryRunner.query(
      `ALTER TABLE "visibleTransactions" ADD CONSTRAINT "FK_1f9ba40f27ea5b5179e8c45ac25" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "visibleTransactions" ADD CONSTRAINT "FK_cb869a1d26d0545f10626bf9ebc" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "visibleLogs" ADD CONSTRAINT "FK_43df0ce809a56d5c2745d7a34d5" FOREIGN KEY ("logNumber") REFERENCES "logs"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "visibleLogs" ADD CONSTRAINT "FK_cf539ab8d4ecd7a31f2003953d3" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addressVisibleTransactions" ADD CONSTRAINT "FK_36f31745cd471591835af79ade7" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addressVisibleTransactions" ADD CONSTRAINT "FK_392a7e8702c4bbe6926a2bce66d" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "addressVisibleTransactions" DROP CONSTRAINT "FK_392a7e8702c4bbe6926a2bce66d"`
    );
    await queryRunner.query(
      `ALTER TABLE "addressVisibleTransactions" DROP CONSTRAINT "FK_36f31745cd471591835af79ade7"`
    );
    await queryRunner.query(`ALTER TABLE "visibleLogs" DROP CONSTRAINT "FK_cf539ab8d4ecd7a31f2003953d3"`);
    await queryRunner.query(`ALTER TABLE "visibleLogs" DROP CONSTRAINT "FK_43df0ce809a56d5c2745d7a34d5"`);
    await queryRunner.query(`ALTER TABLE "visibleTransactions" DROP CONSTRAINT "FK_cb869a1d26d0545f10626bf9ebc"`);
    await queryRunner.query(`ALTER TABLE "visibleTransactions" DROP CONSTRAINT "FK_1f9ba40f27ea5b5179e8c45ac25"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c2ed36b20ba87102b821ff555a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_382f446361db1f82055eae989a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17cd4abaff93f9d170eecee24f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ae784f6b1cd5d7e46d57abb426"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c45d488f03a4724a1b8490068c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9228143efe55cf142e861bc502"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "transactionTo"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "transactionFrom"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "fromToMax"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "fromToMin"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "fromToMax"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "fromToMin"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1635dac1e1b877b7b2f9f65aef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_392a7e8702c4bbe6926a2bce66"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_36f31745cd471591835af79ade"`);
    await queryRunner.query(`DROP TABLE "addressVisibleTransactions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e8f7413334423b8549171b3c99"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8d414a90da6ffce76ac59e28e1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_43df0ce809a56d5c2745d7a34d"`);
    await queryRunner.query(`DROP TABLE "visibleLogs"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c954af638c99003126575112ad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cb869a1d26d0545f10626bf9eb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1f9ba40f27ea5b5179e8c45ac2"`);
    await queryRunner.query(`DROP TABLE "visibleTransactions"`);
  }
}
