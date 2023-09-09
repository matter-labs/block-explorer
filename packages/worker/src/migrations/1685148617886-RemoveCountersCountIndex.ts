import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCountersCountIndex1685148617886 implements MigrationInterface {
  name = "RemoveCountersCountIndex1685148617886";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c5a8e1fd9a3fdc0e61a6f4b2d6"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_c5a8e1fd9a3fdc0e61a6f4b2d6" ON "counters" ("count") `);
  }
}
