import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeTransactionToFieldOptional1734453474315 implements MigrationInterface {
  name = "MakeTransactionToFieldOptional1734453474315";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "to" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addressTransactions" ALTER COLUMN "address" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "to" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "to" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addressTransactions" ALTER COLUMN "address" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "to" SET NOT NULL`);
  }
}
