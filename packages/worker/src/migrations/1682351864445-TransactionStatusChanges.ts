import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionStatusChanges1682351864445 implements MigrationInterface {
  name = "TransactionStatusChanges1682351864445";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transactions_status_enum"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "receiptStatus" integer NOT NULL DEFAULT '1'`);
    await queryRunner.query(`
            UPDATE transactions tx
            SET "receiptStatus" = txr.status
            FROM "transactionReceipts" txr
            WHERE tx.hash = txr."transactionHash"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "receiptStatus"`);
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'included', 'verified', 'failed')`
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending'`
    );
  }
}
