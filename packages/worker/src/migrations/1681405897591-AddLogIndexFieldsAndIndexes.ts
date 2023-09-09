import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogIndexFieldsAndIndexes1681405897591 implements MigrationInterface {
  name = "AddLogIndexFieldsAndIndexes1681405897591";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_23368dc6dbdbe92f83c8bb1fd8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a629587e749dda5721fed9a5c3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_435f738cb042dc9ad18b4c0fea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5165fcd06a6954903a1d5f5201"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_802e133f929cd9a9e0db73ed7f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_730b817608cd0ed733d5b54837"`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "createdInLogIndex" integer`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "logIndex" integer NOT NULL DEFAULT '-1'`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "logIndex" integer NOT NULL DEFAULT '-1'`);
    await queryRunner.query(
      `CREATE INDEX "IDX_da0af10ab2ac8430a51a371fd1" ON "transactions" ("blockNumber", "transactionIndex") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_f1d168776e18becd1d1a5e594f" ON "tokens" ("blockNumber", "logIndex") `);
    await queryRunner.query(`CREATE INDEX "IDX_a91f78bc84b9e71712e5d87b5b" ON "logs" ("blockNumber", "logIndex") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_6ac2bd9363bf7a75242fe12632" ON "transfers" ("blockNumber", "logIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_6ac2bd9363bf7a75242fe12632"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a91f78bc84b9e71712e5d87b5b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f1d168776e18becd1d1a5e594f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_da0af10ab2ac8430a51a371fd1"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "logIndex"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "logIndex"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "createdInLogIndex"`);
    await queryRunner.query(`CREATE INDEX "IDX_730b817608cd0ed733d5b54837" ON "transfers" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_802e133f929cd9a9e0db73ed7f" ON "logs" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_5165fcd06a6954903a1d5f5201" ON "tokens" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_435f738cb042dc9ad18b4c0fea" ON "tokens" ("number") `);
    await queryRunner.query(`CREATE INDEX "IDX_a629587e749dda5721fed9a5c3" ON "transactions" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_23368dc6dbdbe92f83c8bb1fd8" ON "transactions" ("number") `);
  }
}
