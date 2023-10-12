import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenTransferIndexes1697149578188 implements MigrationInterface {
  name = "AddTokenTransferIndexes1697149578188";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."transfers_tokentype_enum" AS ENUM('ETH', 'ERC20', 'ERC721')`);
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD "tokenType" "public"."transfers_tokentype_enum" NOT NULL DEFAULT 'ETH'`
    );

    await queryRunner.query(`UPDATE "transfers" SET "tokenType" = 'ERC721' WHERE "fields" IS NOT NULL`);
    await queryRunner.query(
      `UPDATE "transfers" SET "tokenType" = 'ERC20' WHERE "tokenAddress" != decode('000000000000000000000000000000000000800a', 'hex') AND "fields" IS NULL`
    );

    await queryRunner.query(`CREATE TYPE "public"."addressTransfers_tokentype_enum" AS ENUM('ETH', 'ERC20', 'ERC721')`);
    await queryRunner.query(
      `ALTER TABLE "addressTransfers" ADD "tokenType" "public"."addressTransfers_tokentype_enum" NOT NULL DEFAULT 'ETH'`
    );

    await queryRunner.query(`UPDATE "addressTransfers" SET "tokenType" = 'ERC721' WHERE "fields" IS NOT NULL`);
    await queryRunner.query(
      `UPDATE "addressTransfers" SET "tokenType" = 'ERC20' WHERE "tokenAddress" != decode('000000000000000000000000000000000000800a', 'hex') AND "fields" IS NULL`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_81191c296b89f6e7bbe819b995" ON "transfers" ("tokenAddress", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3a14ae1d50aa1835187e4bb4a" ON "addressTransfers" ("address", "tokenType", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa3c56addbb167c7d036a7dc1e" ON "addressTransfers" ("address", "tokenAddress", "blockNumber", "logIndex") `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_fb96732095e7d0512f39f8a83b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cda11ccd43f408399fa92067c0"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_cda11ccd43f408399fa92067c0" ON "addressTransfers" ("address", "blockNumber", "logIndex", "tokenAddress", "fields") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fb96732095e7d0512f39f8a83b" ON "transfers" ("blockNumber", "fields", "tokenAddress", "logIndex") `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_aa3c56addbb167c7d036a7dc1e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e3a14ae1d50aa1835187e4bb4a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_81191c296b89f6e7bbe819b995"`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP COLUMN "tokenType"`);
    await queryRunner.query(`DROP TYPE "public"."addressTransfers_tokentype_enum"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "tokenType"`);
    await queryRunner.query(`DROP TYPE "public"."transfers_tokentype_enum"`);
  }
}
