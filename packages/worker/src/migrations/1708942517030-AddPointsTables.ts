import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPointsTables1708942517030 implements MigrationInterface {
  name = "AddPointsTables1708942517030";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "points" ("id" BIGSERIAL NOT NULL, "address" bytea NOT NULL, "stakePoint" bigint NOT NULL, "refPoint" bigint NOT NULL, CONSTRAINT "PK_c9bd7c6da50151b24c19e90a0f5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_186821d745a802779bae61192c" ON "points" ("address") `);
    await queryRunner.query(
      `CREATE TABLE "pointsHistory" ("id" BIGSERIAL NOT NULL, "address" bytea NOT NULL, "blockNumber" bigint NOT NULL, "stakePoint" bigint NOT NULL, "refPoint" bigint NOT NULL, CONSTRAINT "PK_3d3989db885fde70a502ffa3264" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_b1b95df312364b2d2ce420b2c8" ON "pointsHistory" ("address") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "networkKey" DROP NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b1b95df312364b2d2ce420b2c8"`);
    await queryRunner.query(`DROP TABLE "pointsHistory"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_186821d745a802779bae61192c"`);
    await queryRunner.query(`DROP TABLE "points"`);
  }
}
