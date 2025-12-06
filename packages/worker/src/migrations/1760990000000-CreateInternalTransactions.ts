import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInternalTransactions1760990000000 implements MigrationInterface {
  name = "CreateInternalTransactions1760990000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "internal_transactions" (
        "id" BIGSERIAL NOT NULL,
        "transactionHash" bytea NOT NULL,
        "blockNumber" bigint NOT NULL,
        "from" bytea NOT NULL,
        "to" bytea,
        "value" numeric(78, 0) NOT NULL DEFAULT '0',
        "gas" bigint,
        "gasUsed" bigint,
        "input" text,
        "output" text,
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
      `CREATE INDEX "IDX_internal_transactions_transactionHash" ON "internal_transactions" ("transactionHash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_internal_transactions_blockNumber" ON "internal_transactions" ("blockNumber")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_internal_transactions_from" ON "internal_transactions" ("from")`);
    await queryRunner.query(`CREATE INDEX "IDX_internal_transactions_to" ON "internal_transactions" ("to")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_internal_transactions_traceIndex" ON "internal_transactions" ("traceIndex")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_internal_transactions_blockNumber_traceIndex" ON "internal_transactions" ("blockNumber", "traceIndex")`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_internal_transactions_transactionHash_traceAddress" ON "internal_transactions" ("transactionHash", "traceAddress")`
    );

    await queryRunner.query(
      `ALTER TABLE "internal_transactions" ADD CONSTRAINT "FK_internal_transactions_blockNumber" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "internal_transactions" ADD CONSTRAINT "FK_internal_transactions_transactionHash" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "internal_transactions" DROP CONSTRAINT "FK_internal_transactions_transactionHash"`
    );
    await queryRunner.query(
      `ALTER TABLE "internal_transactions" DROP CONSTRAINT "FK_internal_transactions_blockNumber"`
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_internal_transactions_transactionHash_traceAddress"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internal_transactions_blockNumber_traceIndex"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internal_transactions_traceIndex"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internal_transactions_to"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internal_transactions_from"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internal_transactions_blockNumber"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_internal_transactions_transactionHash"`);
    await queryRunner.query(`DROP TABLE "internal_transactions"`);
  }
}
