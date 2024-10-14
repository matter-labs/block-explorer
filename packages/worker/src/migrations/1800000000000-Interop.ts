import { MigrationInterface, QueryRunner } from "typeorm";

export class Interop1800000000000 implements MigrationInterface {
  name = "Interop1800000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "interopSourceChain" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "interopSourceAddress" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "interopSourceTx" bytea`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "interopSourceChain"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "interopSourceAddress"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "interopSourceTx"`);
  }
}
