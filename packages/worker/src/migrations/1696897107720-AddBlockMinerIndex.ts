import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockMinerIndex1696897107720 implements MigrationInterface {
  name = "AddBlockMinerIndex1696897107720";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_1ccfbf9a34c2be286db278de8c" ON "blocks" ("miner", "number") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_1ccfbf9a34c2be286db278de8c"`);
  }
}
