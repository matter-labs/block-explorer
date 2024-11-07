import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScriptMigrations1710057320666 implements MigrationInterface {
  name = "AddScriptMigrations1710057320666";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."scriptMigrations_status_enum" AS ENUM('not_started', 'pending', 'failed', 'completed', 'outdated')`
    );
    await queryRunner.query(
      `CREATE TABLE "scriptMigrations" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "timestamp" bigint NOT NULL, "status" "public"."scriptMigrations_status_enum" NOT NULL DEFAULT 'not_started', "params" jsonb, CONSTRAINT "PK_def0d458be005c5e9640f69dde8" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_42f873351064e516bd8dcbec67" ON "scriptMigrations" ("name") `);
    await queryRunner.query(`CREATE INDEX "IDX_7dabb5b44d259202dabf3d1621" ON "scriptMigrations" ("timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_f13cd15275d590b0af3e466907" ON "scriptMigrations" ("status") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_f13cd15275d590b0af3e466907"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7dabb5b44d259202dabf3d1621"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_42f873351064e516bd8dcbec67"`);
    await queryRunner.query(`DROP TABLE "scriptMigrations"`);
    await queryRunner.query(`DROP TYPE "public"."scriptMigrations_status_enum"`);
  }
}
