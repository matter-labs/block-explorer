import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockStatus1758746198683 implements MigrationInterface {
  name = "AddBlockStatus1758746198683";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."blocks_status_enum" AS ENUM('sealed', 'committed', 'proven', 'executed')`
    );
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD "status" "public"."blocks_status_enum" NOT NULL DEFAULT 'sealed'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_4ec3e6af0e990a56309b9a120a" ON "blocks" ("status", "number") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_4ec3e6af0e990a56309b9a120a"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."blocks_status_enum"`);
  }
}
