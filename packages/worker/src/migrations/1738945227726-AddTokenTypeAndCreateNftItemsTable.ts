import { MigrationInterface, QueryRunner } from "typeorm";
export class AddTokenTypeAndCreateNftItemsTable1738945227726 implements MigrationInterface {
  name = "AddTokenTypeAndCreateNftItemsTable1738945227726";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nftitems" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "tokenId" character varying NOT NULL, "tokenAddress" bytea NOT NULL, "owner" bytea NOT NULL, "name" character varying, "description" character varying, "imageUrl" character varying, "metadataUrl" character varying, CONSTRAINT "PK_c4b9cf529a59fc04928afdbdc8a" PRIMARY KEY ("tokenId", "tokenAddress"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_b0997b2b8a9778f095bc0bb63b" ON "nftitems" ("owner") `);
    await queryRunner.query(`CREATE INDEX "IDX_c4b9cf529a59fc04928afdbdc8" ON "nftitems" ("tokenId", "tokenAddress") `);
    await queryRunner.query(`CREATE TYPE "public"."tokens_type_enum" AS ENUM('BASETOKEN', 'ERC20', 'ERC721')`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "type" "public"."tokens_type_enum"`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c4b9cf529a59fc04928afdbdc8"`);
    await queryRunner.query(`DROP TABLE "nftitems"`);
  }
}
