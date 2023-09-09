import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGasPerPubdataToTransaction1688721774786 implements MigrationInterface {
  name = "AddGasPerPubdataToTransaction1688721774786";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "gasPerPubdata" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "gasPerPubdata"`);
  }
}
