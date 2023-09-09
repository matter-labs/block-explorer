import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransferTransactionIndex1683381147191 implements MigrationInterface {
  name = "AddTransferTransactionIndex1683381147191";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" ADD "transactionIndex" integer NOT NULL DEFAULT '-1'`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cce16d4b11170ae71821688fa7" ON "transfers" ("blockNumber", "transactionIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_cce16d4b11170ae71821688fa7"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "transactionIndex"`);
  }
}
