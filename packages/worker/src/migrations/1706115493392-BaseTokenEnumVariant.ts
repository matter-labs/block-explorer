import { MigrationInterface, QueryRunner } from "typeorm";

export class BaseTokenEnumVariant1706115493392 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."transfers_tokentype_enum" RENAME VALUE 'ETH' TO 'BASETOKEN'`);
    await queryRunner.query(`ALTER TYPE "public"."addressTransfers_tokentype_enum" RENAME VALUE 'ETH' TO 'BASETOKEN'`);

    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "tokenType" SET DEFAULT 'BASETOKEN'`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" ALTER COLUMN "tokenType" SET DEFAULT 'BASETOKEN'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."transfers_tokentype_enum" RENAME VALUE 'BASETOKEN' TO 'ETH'`);
    await queryRunner.query(`ALTER TYPE "public"."addressTransfers_tokentype_enum" RENAME VALUE 'BASETOKEN' TO 'ETH'`);

    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "tokenType" SET DEFAULT 'ETH'`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" ALTER COLUMN "tokenType" SET DEFAULT 'ETH'`);
  }
}
