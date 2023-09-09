import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesForForeignKeys1685142951511 implements MigrationInterface {
  name = "AddIndexesForForeignKeys1685142951511";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_a24a74fdf520375abc7a7eb188" ON "addresses" ("creatorTxHash") `);
    await queryRunner.query(`CREATE INDEX "IDX_32d1fee33194687356298e56b8" ON "tokens" ("transactionHash") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_32d1fee33194687356298e56b8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a24a74fdf520375abc7a7eb188"`);
  }
}
