import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesForTransactionsFiltering1690231930493 implements MigrationInterface {
  name = "AddIndexesForTransactionsFiltering1690231930493";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_41d0949231626ebf9c26fc2aff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a629587e749dda5721fed9a5c3"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ea74bf1e592f259b3e64884eb7" ON "transactions" ("blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c41a3520808b2c207d4343aa46" ON "transactions" ("l1BatchNumber", "receivedAt", "transactionIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c41a3520808b2c207d4343aa46"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ea74bf1e592f259b3e64884eb7"`);
    await queryRunner.query(`CREATE INDEX "IDX_a629587e749dda5721fed9a5c3" ON "transactions" ("blockNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_41d0949231626ebf9c26fc2aff" ON "transactions" ("l1BatchNumber") `);
  }
}
