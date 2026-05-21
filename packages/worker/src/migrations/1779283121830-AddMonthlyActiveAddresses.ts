import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonthlyActiveAddresses1779283121830 implements MigrationInterface {
  name = "AddMonthlyActiveAddresses1779283121830";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "monthlyActiveAddressCounts" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "month" date NOT NULL, "count" bigint NOT NULL, CONSTRAINT "PK_ccbd094ab349d4a4e6ccc7fff1f" PRIMARY KEY ("month"))`
    );
    await queryRunner.query(
      `CREATE TABLE "monthlyActiveAddresses" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "month" date NOT NULL, "address" bytea NOT NULL, "blockNumber" bigint NOT NULL, CONSTRAINT "PK_9a3de1c8b7ca8ac29b1451a6a53" PRIMARY KEY ("month", "address"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b228fcb0b25fe440346b88329f" ON "monthlyActiveAddresses" ("blockNumber") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_b228fcb0b25fe440346b88329f"`);
    await queryRunner.query(`DROP TABLE "monthlyActiveAddresses"`);
    await queryRunner.query(`DROP TABLE "monthlyActiveAddressCounts"`);
  }
}
