import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdditionalFieldsToAddressTransfer1692918959833 implements MigrationInterface {
  name = "AddAdditionalFieldsToAddressTransfer1692918959833";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addressTransfers" ADD "tokenAddress" bytea`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" ADD "fields" jsonb`);
    await queryRunner.query(`
            UPDATE "addressTransfers" SET "tokenAddress" = transfers."tokenAddress", "fields" = transfers.fields
            FROM transfers
            WHERE "addressTransfers"."transferNumber" = transfers.number
        `);
    await queryRunner.query(
      `CREATE INDEX "IDX_fb96732095e7d0512f39f8a83b" ON "transfers" ("tokenAddress", "fields", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cda11ccd43f408399fa92067c0" ON "addressTransfers" ("address", "tokenAddress", "fields", "blockNumber", "logIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_cda11ccd43f408399fa92067c0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fb96732095e7d0512f39f8a83b"`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP COLUMN "fields"`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP COLUMN "tokenAddress"`);
  }
}
