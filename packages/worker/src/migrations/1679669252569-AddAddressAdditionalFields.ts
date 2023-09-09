import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressAdditionalFields1679669252569 implements MigrationInterface {
  name = "AddAddressAdditionalFields1679669252569";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" ADD "bytecode" bytea`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "createdInBlockNumber" bigint`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "creatorTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "creatorAddress" bytea`);
    await queryRunner.query(`UPDATE "addresses" SET "bytecode" = decode('', 'hex')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "creatorAddress"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "creatorTxHash"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "createdInBlockNumber"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "bytecode"`);
  }
}
