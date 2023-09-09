import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampToTransfersAndLogs1685571745572 implements MigrationInterface {
  name = "AddTimestampToTransfersAndLogs1685571745572";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_19545b223ccf5caa01c8fb3365"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ae2ec51df8ca944897e769c9a1"`);
    await queryRunner.query(`ALTER TABLE "transfers" RENAME COLUMN "transactionReceivedAt" TO "timestamp"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "timestamp" TIMESTAMP`);
    await queryRunner.query(`UPDATE "logs" SET "timestamp" = '1970-01-01T00:00:00.000Z'`);
    await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "timestamp" SET NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f1d168776e18becd1d1a5e594f"`);
    await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "logIndex" DROP DEFAULT`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ac2bd9363bf7a75242fe12632"`);
    await queryRunner.query(
      `UPDATE "transfers" SET "timestamp" = '1970-01-01T00:00:00.000Z' WHERE "timestamp" IS NULL`
    );
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "timestamp" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "transactionIndex" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "logIndex" DROP DEFAULT`);
    await queryRunner.query(`CREATE INDEX "IDX_f1d168776e18becd1d1a5e594f" ON "tokens" ("blockNumber", "logIndex") `);
    await queryRunner.query(`CREATE INDEX "IDX_48ff10123de1f12ad97d9389ec" ON "transfers" ("to", "timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_6ad30b2019d8c3c912e8ebcbad" ON "transfers" ("from", "timestamp") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_6ac2bd9363bf7a75242fe12632" ON "transfers" ("blockNumber", "logIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_6ac2bd9363bf7a75242fe12632"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ad30b2019d8c3c912e8ebcbad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_48ff10123de1f12ad97d9389ec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f1d168776e18becd1d1a5e594f"`);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "logIndex" SET DEFAULT '-1'`);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "transactionIndex" SET DEFAULT '-1'`);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "timestamp" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6ac2bd9363bf7a75242fe12632" ON "transfers" ("blockNumber", "logIndex") `
    );
    await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "logIndex" SET DEFAULT '-1'`);
    await queryRunner.query(`CREATE INDEX "IDX_f1d168776e18becd1d1a5e594f" ON "tokens" ("blockNumber", "logIndex") `);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "timestamp" integer`);
    await queryRunner.query(`ALTER TABLE "transfers" RENAME COLUMN "timestamp" TO "transactionReceivedAt"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ae2ec51df8ca944897e769c9a1" ON "transfers" ("from", "transactionReceivedAt") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_19545b223ccf5caa01c8fb3365" ON "transfers" ("to", "transactionReceivedAt") `
    );
  }
}
