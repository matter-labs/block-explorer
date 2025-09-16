import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEntityFieldsForZKsyncOS1755873714784 implements MigrationInterface {
  name = "RemoveEntityFieldsForZKsyncOS1755873714784";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "chainId"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "l1BatchNumber" SET DEFAULT '0'`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33d33b468baadbec2f94ce52d2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c41a3520808b2c207d4343aa46"`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "l1BatchNumber" SET DEFAULT '0'`);
    await queryRunner.query(
      `CREATE INDEX "IDX_33d33b468baadbec2f94ce52d2" ON "transactions" ("from", "isL1Originated", "l1BatchNumber", "nonce") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c41a3520808b2c207d4343aa46" ON "transactions" ("l1BatchNumber", "receivedAt", "transactionIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c41a3520808b2c207d4343aa46"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33d33b468baadbec2f94ce52d2"`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "l1BatchNumber" DROP DEFAULT`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c41a3520808b2c207d4343aa46" ON "transactions" ("transactionIndex", "l1BatchNumber", "receivedAt") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33d33b468baadbec2f94ce52d2" ON "transactions" ("nonce", "l1BatchNumber", "isL1Originated", "from") `
    );
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "l1BatchNumber" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "type" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "chainId" integer NOT NULL`);
  }
}
