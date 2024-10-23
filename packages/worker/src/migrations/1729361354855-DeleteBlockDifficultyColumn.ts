import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteBlockDifficultyColumn1729361354855 implements MigrationInterface {
  name = "DeleteBlockDifficultyColumn1729361354855";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "_difficulty"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blocks" ADD "_difficulty" character varying(128) NOT NULL`);
  }
}
