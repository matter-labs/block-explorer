import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBalancesWithZeroValue1687975773306 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "tmp_balance_zero_balance" ON "balances" ("balance");`);
    await queryRunner.query(`DELETE FROM "balances" WHERE "balance" = '0';`);
    await queryRunner.query(`DROP INDEX "tmp_balance_zero_balance";`);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
