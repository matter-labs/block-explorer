import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTransfersIndexes1684771437335 implements MigrationInterface {
  name = "ChangeTransfersIndexes1684771437335";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_e13ab0f8b91a6788a2604404f1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0689c81f39710fe137c65fe3be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cce16d4b11170ae71821688fa7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_47c581d1bc3b457d3aea39ecb8"`);
    await queryRunner.query(`CREATE INDEX "IDX_2fdb5277f14e26e749075fcdd7" ON "transactions" ("to") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_19545b223ccf5caa01c8fb3365" ON "transfers" ("to", "transactionReceivedAt") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae2ec51df8ca944897e769c9a1" ON "transfers" ("from", "transactionReceivedAt") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_ae2ec51df8ca944897e769c9a1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_19545b223ccf5caa01c8fb3365"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2fdb5277f14e26e749075fcdd7"`);
    await queryRunner.query(`CREATE INDEX "IDX_47c581d1bc3b457d3aea39ecb8" ON "transfers" ("transactionReceivedAt") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cce16d4b11170ae71821688fa7" ON "transfers" ("blockNumber", "transactionIndex") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_0689c81f39710fe137c65fe3be" ON "transfers" ("to") `);
    await queryRunner.query(`CREATE INDEX "IDX_e13ab0f8b91a6788a2604404f1" ON "transfers" ("from") `);
  }
}
