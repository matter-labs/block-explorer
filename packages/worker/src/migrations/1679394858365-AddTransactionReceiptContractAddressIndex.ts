import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionReceiptContractAddressIndex1679394858365 implements MigrationInterface {
  name = "AddTransactionReceiptContractAddressIndex1679394858365";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_98ff447fd46a5b297f0ddb4aff" ON "transactionReceipts" ("contractAddress") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_98ff447fd46a5b297f0ddb4aff"`);
  }
}
