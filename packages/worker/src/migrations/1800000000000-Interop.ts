import { MigrationInterface, QueryRunner } from "typeorm";

export class Interop1800000000000 implements MigrationInterface {
  name = "Interop1800000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "sourceChain" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "sourceAccount" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "sourceTx" bytea`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "sourceChain"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "sourceAccount"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "sourceTx"`);
  }
}
