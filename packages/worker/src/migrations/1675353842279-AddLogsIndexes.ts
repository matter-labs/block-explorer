import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogsIndexes1675353842279 implements MigrationInterface {
  name = "AddLogsIndexes1675353842279";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_cf3cf6b059a0a710d026b68a34" ON "logs" ("transactionHash") `);
    await queryRunner.query(`CREATE INDEX "IDX_f94e870c97029faa5f4fc9f529" ON "logs" ("address") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_f94e870c97029faa5f4fc9f529"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cf3cf6b059a0a710d026b68a34"`);
  }
}
