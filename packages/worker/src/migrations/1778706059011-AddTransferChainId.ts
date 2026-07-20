import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransferChainId1778706059011 implements MigrationInterface {
  name = "AddTransferChainId1778706059011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" ADD "chainId" character varying(128)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "chainId"`);
  }
}
