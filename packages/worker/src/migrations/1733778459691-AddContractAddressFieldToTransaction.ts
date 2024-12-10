import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContractAddressFieldToTransaction1733778459691 implements MigrationInterface {
  name = "AddContractAddressFieldToTransaction1733778459691";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "contractAddress" bytea`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "contractAddress"`);
  }
}
