import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBatches1758922527781 implements MigrationInterface {
  name = "RemoveBatches1758922527781";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_6b08048b61bf9f4c139336a3b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33d33b468baadbec2f94ce52d2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c41a3520808b2c207d4343aa46"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "l1BatchNumber"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "l1BatchNumber"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_633311d1e696adb0386d707ae8" ON "transactions" ("from", "isL1Originated", "blockNumber", "nonce") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_633311d1e696adb0386d707ae8"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "l1BatchNumber" bigint NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "l1BatchNumber" bigint NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c41a3520808b2c207d4343aa46" ON "transactions" ("transactionIndex", "l1BatchNumber", "receivedAt") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33d33b468baadbec2f94ce52d2" ON "transactions" ("nonce", "l1BatchNumber", "isL1Originated", "from") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_6b08048b61bf9f4c139336a3b5" ON "blocks" ("l1BatchNumber") `);
  }
}
