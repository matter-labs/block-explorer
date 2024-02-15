import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenOffChainData1698729230516 implements MigrationInterface {
  name = "AddTokenOffChainData1698729230516";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" ADD "usdPrice" double precision`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "liquidity" double precision`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "iconURL" character varying`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "offChainDataUpdatedAt" TIMESTAMP`);
    await queryRunner.query(`CREATE INDEX "IDX_eab106a9418a761805c415fdeb" ON "tokens" ("l1Address") `);
    await queryRunner.query(`CREATE INDEX "IDX_f9d4a596adf95ca64ed98810fd" ON "tokens" ("offChainDataUpdatedAt") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_c45d488f03a4724a1b8490068c" ON "tokens" ("liquidity", "blockNumber", "logIndex") `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_f1d168776e18becd1d1a5e594f"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c45d488f03a4724a1b8490068c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f9d4a596adf95ca64ed98810fd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eab106a9418a761805c415fdeb"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "offChainDataUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "iconURL"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "liquidity"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "usdPrice"`);
    await queryRunner.query(`CREATE INDEX "IDX_f1d168776e18becd1d1a5e594f" ON "tokens" ("blockNumber", "logIndex") `);
  }
}
