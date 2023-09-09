import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSequenceForDeleteBalancesFunctionality1688635613573 implements MigrationInterface {
  name = "CreateSequenceForDeleteBalancesFunctionality1688635613573";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE "deleteBalances_fromBlockNumber" AS BIGINT MINVALUE -1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE "deleteBalances_fromBlockNumber"`);
  }
}
