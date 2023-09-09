import { MigrationInterface, QueryRunner } from "typeorm";

export class RecreateTransactionReceiptNumberIndex1683661953033 implements MigrationInterface {
  name = "RecreateTransactionReceiptNumberIndex1683661953033";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_d79410e38050a25a02ea8fac5e"`);
    await queryRunner.query(`CREATE INDEX "IDX_d79410e38050a25a02ea8fac5e" ON "transactionReceipts" ("number") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_d79410e38050a25a02ea8fac5e"`);
    await queryRunner.query(`CREATE INDEX "IDX_d79410e38050a25a02ea8fac5e" ON "transactionReceipts" ("number") `);
  }
}
