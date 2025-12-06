import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInternalTransactions1760990000000 implements MigrationInterface {
  name = "CreateInternalTransactions1760990000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "internalTransactions" (
        "id" BIGSERIAL NOT NULL,
        "transactionHash" bytea NOT NULL,
        "blockNumber" bigint NOT NULL,
        "from" bytea NOT NULL,
        "to" bytea,
        "value" numeric(78, 0) NOT NULL DEFAULT '0',
        "gas" bigint,
        "gasUsed" bigint,
        "input" bytea,
        "output" bytea,
        "type" character varying NOT NULL,
        "callType" character varying,
        "traceAddress" character varying NOT NULL,
        "traceIndex" integer NOT NULL,
        "error" character varying,
        "timestamp" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_internal_transactions_id" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_internalTransactions_transactionHash" ON "internalTransactions" ("transactionHash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_internalTransactions_blockNumber" ON "internalTransactions" ("blockNumber")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_internalTransactions_from" ON "internalTransactions" ("from")`);
    await queryRunner.query(`CREATE INDEX "IDX_internalTransactions_to" ON "internalTransactions" ("to")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_internalTransactions_traceIndex" ON "internalTransactions" ("traceIndex")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_internalTransactions_blockNumber_traceIndex" ON "internalTransactions" ("blockNumber", "traceIndex")`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_internalTransactions_transactionHash_traceAddress" ON "internalTransactions" ("transactionHash", "traceAddress")`
    );

    await queryRunner.query(
      `ALTER TABLE "internalTransactions" ADD CONSTRAINT "FK_internalTransactions_blockNumber" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "internalTransactions" ADD CONSTRAINT "FK_internalTransactions_transactionHash" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "internalTransactions" DROP CONSTRAINT "FK_internalTransactions_transactionHash"`
    );
    await queryRunner.query(`ALTER TABLE "internalTransactions" DROP CONSTRAINT "FK_internalTransactions_blockNumber"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_internalTransactions_transactionHash_traceAddress"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internalTransactions_blockNumber_traceIndex"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internalTransactions_traceIndex"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internalTransactions_to"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internalTransactions_from"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internalTransactions_blockNumber"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internalTransactions_transactionHash"`);
    await queryRunner.query(`DROP TABLE "internalTransactions"`);
  }
}
