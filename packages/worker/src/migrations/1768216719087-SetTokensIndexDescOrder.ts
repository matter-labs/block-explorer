import { MigrationInterface, QueryRunner } from "typeorm";

export class SetTokensIndexDescOrder1768216719087 implements MigrationInterface {
  name = "SetTokensIndexDescOrder1768216719087";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_f1d168776e18becd1d1a5e594f" ON "tokens" ("liquidity" DESC NULLS LAST, "blockNumber" DESC, "logIndex" DESC) `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_c45d488f03a4724a1b8490068c"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_c45d488f03a4724a1b8490068c" ON "tokens" ("liquidity", "blockNumber", "logIndex") `
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_f1d168776e18becd1d1a5e594f"`);
  }
}
