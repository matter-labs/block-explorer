import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampIndexes1682382038751 implements MigrationInterface {
  name = "AddTimestampIndexes1682382038751";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_2459869ace608604aeead85d89" ON "batches" ("timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_189086df58d15108852871f74a" ON "blocks" ("timestamp") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23368dc6dbdbe92f83c8bb1fd8" ON "transactions" ("number") `);
    await queryRunner.query(`CREATE INDEX "IDX_9738f201ba50810be605cab392" ON "transactions" ("receivedAt") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9738f201ba50810be605cab392"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23368dc6dbdbe92f83c8bb1fd8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_189086df58d15108852871f74a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2459869ace608604aeead85d89"`);
  }
}
