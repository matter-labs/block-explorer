import { MigrationInterface, QueryRunner } from "typeorm";

export class UseTimestampInsteadOfInt1685652641934 implements MigrationInterface {
  name = "UseTimestampInsteadOfInt1685652641934";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" ADD "timestamp_tmp" TIMESTAMP`);
    await queryRunner.query(`UPDATE "batches" SET "timestamp_tmp" = COALESCE(TO_TIMESTAMP("timestamp"))`);
    await queryRunner.query(`ALTER TABLE "batches" ALTER COLUMN "timestamp_tmp" SET NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2459869ace608604aeead85d89"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "batches" RENAME COLUMN "timestamp_tmp" TO "timestamp"`);

    await queryRunner.query(`ALTER TABLE "blocks" ADD "timestamp_tmp" TIMESTAMP`);
    await queryRunner.query(`UPDATE "blocks" SET "timestamp_tmp" = COALESCE(TO_TIMESTAMP("timestamp"))`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "timestamp_tmp" SET NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_189086df58d15108852871f74a"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "blocks" RENAME COLUMN "timestamp_tmp" TO "timestamp"`);

    await queryRunner.query(`CREATE INDEX "IDX_2459869ace608604aeead85d89" ON "batches" ("timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_189086df58d15108852871f74a" ON "blocks" ("timestamp") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_189086df58d15108852871f74a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2459869ace608604aeead85d89"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "timestamp" integer NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_189086df58d15108852871f74a" ON "blocks" ("timestamp") `);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "timestamp" integer NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_2459869ace608604aeead85d89" ON "batches" ("timestamp") `);
  }
}
