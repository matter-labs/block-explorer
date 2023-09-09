import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockHashUniqueConstraint1675696999813 implements MigrationInterface {
  name = "AddBlockHashUniqueConstraint1675696999813";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "UQ_00d4f3eb491f00ae5bece2a559e" UNIQUE ("hash")`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "parentHash" DROP NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_00d4f3eb491f00ae5bece2a559" ON "blocks" ("hash") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_00d4f3eb491f00ae5bece2a559"`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "parentHash" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "UQ_00d4f3eb491f00ae5bece2a559e"`);
  }
}
