import { MigrationInterface, QueryRunner } from "typeorm";

export class AddERC1155TokenType1792703428147 implements MigrationInterface {
  name = "AddERC1155TokenType1792703428147";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."transfers_tokentype_enum" ADD VALUE IF NOT EXISTS 'ERC1155'`);
    await queryRunner.query(`ALTER TYPE "public"."addressTransfers_tokentype_enum" ADD VALUE IF NOT EXISTS 'ERC1155'`);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing a value from an enum type, recreating the type would require
    // deleting ERC1155 transfers and rewriting the transfers tables. The unused value is harmless, so it is kept.
  }
}
