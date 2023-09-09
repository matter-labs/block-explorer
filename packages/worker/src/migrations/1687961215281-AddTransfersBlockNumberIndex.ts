import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransfersBlockNumberIndex1687961215281 implements MigrationInterface {
  name = "AddTransfersBlockNumberIndex1687961215281";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_cf3cf6b059a0a710d026b68a34"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f94e870c97029faa5f4fc9f529"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a91f78bc84b9e71712e5d87b5b"`);
    await queryRunner.query(`CREATE INDEX "IDX_730b817608cd0ed733d5b54837" ON "transfers" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_802e133f929cd9a9e0db73ed7f" ON "logs" ("blockNumber") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_98f7030b89509e25e434fb2e93" ON "logs" ("transactionHash", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90ca67f84ee01d5122f5de5454" ON "logs" ("address", "timestamp", "logIndex" DESC) `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_90ca67f84ee01d5122f5de5454"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_98f7030b89509e25e434fb2e93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_802e133f929cd9a9e0db73ed7f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_730b817608cd0ed733d5b54837"`);
    await queryRunner.query(`CREATE INDEX "IDX_a91f78bc84b9e71712e5d87b5b" ON "logs" ("blockNumber", "logIndex") `);
    await queryRunner.query(`CREATE INDEX "IDX_f94e870c97029faa5f4fc9f529" ON "logs" ("address") `);
    await queryRunner.query(`CREATE INDEX "IDX_cf3cf6b059a0a710d026b68a34" ON "logs" ("transactionHash") `);
  }
}
