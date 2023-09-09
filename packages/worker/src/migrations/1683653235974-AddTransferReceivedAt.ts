import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransferReceivedAt1683653235974 implements MigrationInterface {
  name = "AddTransferReceivedAt1683653235974";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" ADD "transactionReceivedAt" TIMESTAMP`);
    await queryRunner.query(`CREATE INDEX "IDX_47c581d1bc3b457d3aea39ecb8" ON "transfers" ("transactionReceivedAt") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_47c581d1bc3b457d3aea39ecb8"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "transactionReceivedAt"`);
  }
}
