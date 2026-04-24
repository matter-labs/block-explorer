import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexerState1776371466163 implements MigrationInterface {
  name = "AddIndexerState1776371466163";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "indexerState" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" integer NOT NULL, "lastReadyBlockNumber" bigint NOT NULL, CONSTRAINT "PK_1ec7650bab1d75c477b24f73841" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `INSERT INTO "indexerState" ("id", "lastReadyBlockNumber") VALUES (1, COALESCE((SELECT MAX(number) FROM blocks), 0))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccb146546579d3225b01a2d966" ON "transactions" ("blockNumber", "number") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_fe84fd8b79eb80c1447ef44118" ON "transfers" ("blockNumber", "number") `);
    await queryRunner.query(`DROP INDEX "public"."IDX_730b817608cd0ed733d5b54837"`);
    await queryRunner.query(`ALTER TABLE "counterStates" ADD "lastProcessedBlockNumber" bigint`);
    await queryRunner.query(
      `UPDATE "counterStates" cs SET "lastProcessedBlockNumber" = COALESCE((SELECT "blockNumber" FROM "transactions" WHERE "number" = cs."lastProcessedRecordNumber"), 0) WHERE cs."tableName" = 'transactions'`
    );
    await queryRunner.query(
      `UPDATE "counterStates" cs SET "lastProcessedBlockNumber" = COALESCE((SELECT "blockNumber" FROM "transfers" WHERE "number" = cs."lastProcessedRecordNumber"), 0) WHERE cs."tableName" = 'transfers'`
    );
    await queryRunner.query(`ALTER TABLE "counterStates" ALTER COLUMN "lastProcessedBlockNumber" SET NOT NULL`);
    await queryRunner.query(
      `CREATE TABLE "blockQueue" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "blockNumber" bigint NOT NULL, CONSTRAINT "PK_5f82e29dd5d76691af013fbdb4e" PRIMARY KEY ("blockNumber"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "blockQueue"`);
    await queryRunner.query(`ALTER TABLE "counterStates" DROP COLUMN "lastProcessedBlockNumber"`);
    await queryRunner.query(`CREATE INDEX "IDX_730b817608cd0ed733d5b54837" ON "transfers" ("blockNumber") `);
    await queryRunner.query(`DROP INDEX "public"."IDX_fe84fd8b79eb80c1447ef44118"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ccb146546579d3225b01a2d966"`);
    await queryRunner.query(`DROP TABLE "indexerState"`);
  }
}
