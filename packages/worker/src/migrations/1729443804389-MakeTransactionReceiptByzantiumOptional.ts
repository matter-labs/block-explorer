import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeTransactionReceiptByzantiumOptional1729443804389 implements MigrationInterface {
  name = "MakeTransactionReceiptByzantiumOptional1729443804389";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "byzantium" SET DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "byzantium" DROP DEFAULT`);
  }
}
