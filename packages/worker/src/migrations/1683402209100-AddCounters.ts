import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCounters1683402209100 implements MigrationInterface {
  name = "AddCounters1683402209100";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "counters" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "count" bigint NOT NULL, "tableName" character varying(64) NOT NULL, "queryString" character varying NOT NULL, CONSTRAINT "PK_910bfcbadea9cde6397e0daf996" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_66408ca078e57aef487ad03b09" ON "counters" ("tableName", "queryString") `
    );
    await queryRunner.query(
      `CREATE TABLE "counterStates" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "tableName" character varying(64) NOT NULL, "lastProcessedRecordNumber" bigint NOT NULL, CONSTRAINT "PK_890a5ff8715895f763140d84207" PRIMARY KEY ("tableName"))`
    );
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "number" BIGSERIAL NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_d79410e38050a25a02ea8fac5e" ON "transactionReceipts" ("number") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_d79410e38050a25a02ea8fac5e"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "number"`);
    await queryRunner.query(`DROP TABLE "counterStates"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_66408ca078e57aef487ad03b09"`);
    await queryRunner.query(`DROP TABLE "counters"`);
  }
}
