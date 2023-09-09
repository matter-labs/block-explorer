import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCountersCountIndex1684849695073 implements MigrationInterface {
  name = "AddCountersCountIndex1684849695073";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_c5a8e1fd9a3fdc0e61a6f4b2d6" ON "counters" ("count") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c5a8e1fd9a3fdc0e61a6f4b2d6"`);
  }
}
