import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeTransactionsToFieldOptional1732834001043 implements MigrationInterface {
  name = "MakeTransactionsToFieldOptional1732834001043";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "to" DROP NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f8b841e005e13e12008d9778ed"`);
    await queryRunner.query(`ALTER TABLE "addressTransactions" ALTER COLUMN "address" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "to" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f8b841e005e13e12008d9778ed" ON "addressTransactions" ("address", "blockNumber", "receivedAt", "transactionIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_f8b841e005e13e12008d9778ed"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "to" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addressTransactions" ALTER COLUMN "address" SET NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f8b841e005e13e12008d9778ed" ON "addressTransactions" ("address", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "to" SET NOT NULL`);
  }
}
