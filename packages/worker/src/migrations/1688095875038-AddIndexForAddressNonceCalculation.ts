import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexForAddressNonceCalculation1688095875038 implements MigrationInterface {
  name = "AddIndexForAddressNonceCalculation1688095875038";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9abfb56ad0eb4f1685be665afb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2459869ace608604aeead85d89"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_189086df58d15108852871f74a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f4e63e5ad1ba9d2bbff435613f"`);
    await queryRunner.query(`CREATE INDEX "IDX_468b5ed00f6d47b1552970b2bb" ON "batches" ("timestamp", "number") `);
    await queryRunner.query(`CREATE INDEX "IDX_e509df4634e707a7e96f65c081" ON "batches" ("executedAt", "number") `);
    await queryRunner.query(`CREATE INDEX "IDX_3f6b380e545dcfc23494af6196" ON "blocks" ("timestamp", "number") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_33d33b468baadbec2f94ce52d2" ON "transactions" ("from", "isL1Originated", "l1BatchNumber", "nonce") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_33d33b468baadbec2f94ce52d2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3f6b380e545dcfc23494af6196"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e509df4634e707a7e96f65c081"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_468b5ed00f6d47b1552970b2bb"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f4e63e5ad1ba9d2bbff435613f" ON "transactions" ("from", "isL1Originated", "nonce") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_189086df58d15108852871f74a" ON "blocks" ("timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_2459869ace608604aeead85d89" ON "batches" ("timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_9abfb56ad0eb4f1685be665afb" ON "batches" ("executedAt") `);
  }
}
