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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "indexerState"`);
  }
}
