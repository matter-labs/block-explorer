import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangesForEvmEquivalence1734649984378 implements MigrationInterface {
  name = "ChangesForEvmEquivalence1734649984378";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" ADD "isEvmLike" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "to" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "to" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addressTransactions" ALTER COLUMN "address" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addressTransactions" ALTER COLUMN "address" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "to" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "to" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "isEvmLike"`);
  }
}
