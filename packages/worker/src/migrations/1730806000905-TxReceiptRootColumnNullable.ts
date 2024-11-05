import { MigrationInterface, QueryRunner } from "typeorm";

export class TxReceiptRootColumnNullable1730806000905 implements MigrationInterface {
  name = "TxReceiptRootColumnNullable1730806000905";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "root" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "root" SET NOT NULL`);
  }
}
