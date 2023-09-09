import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustDBSchemaToDeleteBlockInfo1676206820123 implements MigrationInterface {
  name = "AdjustDBSchemaToDeleteBlockInfo1676206820123";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_da0af10ab2ac8430a51a371fd1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e13ab0f8b91a6788a2604404f1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0689c81f39710fe137c65fe3be"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "number" BIGSERIAL NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_23368dc6dbdbe92f83c8bb1fd8" ON "transactions" ("number") `);
    await queryRunner.query(`CREATE INDEX "IDX_a629587e749dda5721fed9a5c3" ON "transactions" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_802e133f929cd9a9e0db73ed7f" ON "logs" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_78b6dc1fe9600ba7de18fec127" ON "transactionReceipts" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_730b817608cd0ed733d5b54837" ON "transfers" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_5165fcd06a6954903a1d5f5201" ON "tokens" ("blockNumber") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_5165fcd06a6954903a1d5f5201"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_730b817608cd0ed733d5b54837"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_78b6dc1fe9600ba7de18fec127"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_802e133f929cd9a9e0db73ed7f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a629587e749dda5721fed9a5c3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23368dc6dbdbe92f83c8bb1fd8"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "number"`);
    await queryRunner.query(`CREATE INDEX "IDX_0689c81f39710fe137c65fe3be" ON "transfers" ("to") `);
    await queryRunner.query(`CREATE INDEX "IDX_e13ab0f8b91a6788a2604404f1" ON "transfers" ("from") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_da0af10ab2ac8430a51a371fd1" ON "transactions" ("transactionIndex", "blockNumber") `
    );
  }
}
