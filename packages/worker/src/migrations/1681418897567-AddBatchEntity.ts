import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBatchEntity1681418897567 implements MigrationInterface {
  name = "AddBatchEntity1681418897567";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "batches" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" bigint NOT NULL, "rootHash" bytea, "timestamp" integer NOT NULL, "l1GasPrice" character varying(128) NOT NULL, "l2FairGasPrice" character varying(128) NOT NULL, "commitTxHash" bytea, "committedAt" TIMESTAMP, "proveTxHash" bytea, "provenAt" TIMESTAMP, "executeTxHash" bytea, "executedAt" TIMESTAMP, "l1TxCount" integer NOT NULL, "l2TxCount" integer NOT NULL, CONSTRAINT "UQ_4b496810fff6ce2504f6f7a5125" UNIQUE ("rootHash"), CONSTRAINT "PK_0d306b67f972c0ebb4a1fdcaf63" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4b496810fff6ce2504f6f7a512" ON "batches" ("rootHash") `);
    await queryRunner.query(`CREATE INDEX "IDX_01dcdc0d294fbdffb0460c6c47" ON "batches" ("committedAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_2e5848205f50af3d87131715e9" ON "batches" ("provenAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_9abfb56ad0eb4f1685be665afb" ON "batches" ("executedAt") `);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "l1BatchNumber" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "l1BatchNumber" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_6b08048b61bf9f4c139336a3b5" ON "blocks" ("l1BatchNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_41d0949231626ebf9c26fc2aff" ON "transactions" ("l1BatchNumber") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_41d0949231626ebf9c26fc2aff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b08048b61bf9f4c139336a3b5"`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "l1BatchNumber" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "l1BatchNumber" DROP NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9abfb56ad0eb4f1685be665afb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2e5848205f50af3d87131715e9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01dcdc0d294fbdffb0460c6c47"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4b496810fff6ce2504f6f7a512"`);
    await queryRunner.query(`DROP TABLE "batches"`);
  }
}
