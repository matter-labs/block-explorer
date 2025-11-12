import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBatches1758922527781 implements MigrationInterface {
  name = "RemoveBatches1758922527781";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_6b08048b61bf9f4c139336a3b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33d33b468baadbec2f94ce52d2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c41a3520808b2c207d4343aa46"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "l1BatchNumber"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "l1BatchNumber"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_633311d1e696adb0386d707ae8" ON "transactions" ("from", "isL1Originated", "blockNumber", "nonce") `
    );
    await queryRunner.query(`DROP TABLE "batches"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "batches"
      (
          "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
          "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
          "number" bigint NOT NULL,
          "rootHash" bytea,
          "l1GasPrice" character varying(128) COLLATE pg_catalog."default" NOT NULL,
          "l2FairGasPrice" character varying(128) COLLATE pg_catalog."default" NOT NULL,
          "commitTxHash" bytea,
          "committedAt" timestamp without time zone,
          "proveTxHash" bytea,
          "provenAt" timestamp without time zone,
          "executeTxHash" bytea,
          "executedAt" timestamp without time zone,
          "l1TxCount" integer NOT NULL,
          "l2TxCount" integer NOT NULL,
          "timestamp" timestamp without time zone NOT NULL,
          "commitChainId" integer,
          "proveChainId" integer,
          "executeChainId" integer,
          CONSTRAINT "PK_0d306b67f972c0ebb4a1fdcaf63" PRIMARY KEY ("number"),
          CONSTRAINT "UQ_4b496810fff6ce2504f6f7a5125" UNIQUE ("rootHash")
      );
      CREATE INDEX "IDX_01dcdc0d294fbdffb0460c6c47" ON "batches" ("committedAt");
      CREATE INDEX "IDX_2e5848205f50af3d87131715e9" ON "batches" ("provenAt");
      CREATE INDEX "IDX_468b5ed00f6d47b1552970b2bb" ON "batches" ("timestamp", "number");
      CREATE UNIQUE INDEX "IDX_4b496810fff6ce2504f6f7a512" ON "batches" ("rootHash");
      CREATE INDEX "IDX_e509df4634e707a7e96f65c081" ON "batches" ("executedAt", "number");
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_633311d1e696adb0386d707ae8"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "l1BatchNumber" bigint NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "l1BatchNumber" bigint NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c41a3520808b2c207d4343aa46" ON "transactions" ("transactionIndex", "l1BatchNumber", "receivedAt") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33d33b468baadbec2f94ce52d2" ON "transactions" ("nonce", "l1BatchNumber", "isL1Originated", "from") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_6b08048b61bf9f4c139336a3b5" ON "blocks" ("l1BatchNumber") `);
  }
}
