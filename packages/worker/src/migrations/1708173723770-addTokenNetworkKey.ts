import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenNetworkKey1708173723770 implements MigrationInterface {
  name = "AddTokenNetworkKey1708173723770";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" ADD "networkKey" character varying NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "networkKey"`);
  }
}
