import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesForTransferType1686961738283 implements MigrationInterface {
  name = "AddIndexesForTransferType1686961738283";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_48ff10123de1f12ad97d9389ec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ad30b2019d8c3c912e8ebcbad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_226e4cb415878b814f472ba02d"`);
    await queryRunner.query(`CREATE INDEX "IDX_58b65a9f96fb3ad879f67b8406" ON "transfers" ("tokenAddress", "type") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_fb035f3e76dd463d87a71289d6" ON "transfers" ("to", "type", "timestamp") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_53a5b7b9a8b63afe25e0251971" ON "transfers" ("from", "type", "timestamp") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_53a5b7b9a8b63afe25e0251971"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fb035f3e76dd463d87a71289d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_58b65a9f96fb3ad879f67b8406"`);
    await queryRunner.query(`CREATE INDEX "IDX_226e4cb415878b814f472ba02d" ON "transfers" ("tokenAddress") `);
    await queryRunner.query(`CREATE INDEX "IDX_6ad30b2019d8c3c912e8ebcbad" ON "transfers" ("from", "timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_48ff10123de1f12ad97d9389ec" ON "transfers" ("to", "timestamp") `);
  }
}
