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
        "value" character varying(128) NOT NULL,
        "gas" character varying(128),
        "gasUsed" character varying(128),
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
        CONSTRAINT "PK_internal_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_internalTransactions_transactionHash_traceAddress" UNIQUE ("transactionHash", "traceAddress"),
        CONSTRAINT "FK_internalTransactions_blockNumber" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_internalTransactions_transactionHash" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE CASCADE ON UPDATE NO ACTION
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
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "internalTransactions"`);
  }
}
