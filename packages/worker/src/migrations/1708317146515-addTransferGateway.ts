import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransferGateway1708317146515 implements MigrationInterface {
  name = "AddTransferGateway1708317146515";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" ADD "gateway" bytea`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "gateway"`);
  }
}
