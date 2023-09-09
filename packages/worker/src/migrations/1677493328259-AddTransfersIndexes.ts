import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransfersIndexes1677493328259 implements MigrationInterface {
  name = "AddTransfersIndexes1677493328259";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_e13ab0f8b91a6788a2604404f1" ON "transfers" ("from") `);
    await queryRunner.query(`CREATE INDEX "IDX_0689c81f39710fe137c65fe3be" ON "transfers" ("to") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0689c81f39710fe137c65fe3be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e13ab0f8b91a6788a2604404f1"`);
  }
}
