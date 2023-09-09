import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockNumberToAddressTransactionIndex1692242709033 implements MigrationInterface {
  name = "AddBlockNumberToAddressTransactionIndex1692242709033";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_f8b841e005e13e12008d9778ed" ON "addressTransactions" ("address", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_b4d30b6cac6431409597b0f480"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_b4d30b6cac6431409597b0f480" ON "addressTransactions" ("address", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_f8b841e005e13e12008d9778ed"`);
  }
}
