import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanUpAddressEntity1684139550709 implements MigrationInterface {
  name = "CleanUpAddressEntity1684139550709";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "blockNumber"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "balances"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" ADD "balances" jsonb`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "blockNumber" bigint NOT NULL`);
  }
}
