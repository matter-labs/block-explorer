import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBalanceBlockNumberBalanceIndex1688471570482 implements MigrationInterface {
  name = "AddBalanceBlockNumberBalanceIndex1688471570482";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_72541bf4560e938ac13a0e936c"`);
    await queryRunner.query(`CREATE INDEX "IDX_9c55e7453afdb89d5a1c65acf1" ON "balances" ("blockNumber", "balance") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9c55e7453afdb89d5a1c65acf1"`);
    await queryRunner.query(`CREATE INDEX "IDX_72541bf4560e938ac13a0e936c" ON "balances" ("blockNumber") `);
  }
}
