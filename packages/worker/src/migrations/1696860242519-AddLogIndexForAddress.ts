import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogIndexForAddress1696860242519 implements MigrationInterface {
  name = "AddLogIndexForAddress1696860242519";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_ebbb1251d0299f223e2d45f98f" ON "logs" ("address", "blockNumber", "logIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_ebbb1251d0299f223e2d45f98f"`);
  }
}
