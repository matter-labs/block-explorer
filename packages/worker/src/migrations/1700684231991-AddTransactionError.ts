import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionError1700684231991 implements MigrationInterface {
  name = "AddTransactionError1700684231991";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "error" character varying`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "revertReason" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "revertReason"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "error"`);
  }
}
