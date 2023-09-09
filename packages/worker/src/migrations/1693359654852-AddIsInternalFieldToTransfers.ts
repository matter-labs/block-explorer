import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsInternalFieldToTransfers1693359654852 implements MigrationInterface {
  name = "AddIsInternalFieldToTransfers1693359654852";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" ADD "isInternal" boolean NOT NULL DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" ADD "isInternal" boolean NOT NULL DEFAULT FALSE`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6b29485268b54ac40f41e8bb49" ON "transfers" ("isInternal", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22c850c7584a8727b44eb4decf" ON "transfers" ("transactionHash", "isInternal", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aba2aae78e735a64d968f1ef3c" ON "addressTransfers" ("address", "isInternal", "blockNumber", "logIndex") `
    );
    await queryRunner.query(`
            UPDATE "transfers" SET "isInternal" = TRUE
            FROM transfers as tr LEFT JOIN transactions ON tr."transactionHash" = transactions.hash
            WHERE "tr"."tokenAddress" = decode('000000000000000000000000000000000000800a', 'hex')
            AND "tr".type = 'transfer'
            AND (tr.from != transactions.from OR tr.to != transactions.to)
        `);
    await queryRunner.query(`
        UPDATE "addressTransfers" SET "isInternal" = transfers."isInternal"
        FROM transfers
        WHERE "addressTransfers"."transferNumber" = transfers.number
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_aba2aae78e735a64d968f1ef3c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_22c850c7584a8727b44eb4decf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b29485268b54ac40f41e8bb49"`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP COLUMN "isInternal"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "isInternal"`);
  }
}
