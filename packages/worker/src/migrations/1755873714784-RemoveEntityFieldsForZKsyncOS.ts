import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEntityFieldsForZKsyncOS1755873714784 implements MigrationInterface {
  name = "RemoveEntityFieldsForZKsyncOS1755873714784";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "chainId"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "l1BatchNumber" SET DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "l1BatchNumber" SET DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "l1BatchNumber" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "blocks" ALTER COLUMN "l1BatchNumber" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "type" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "chainId" integer NOT NULL`);
  }
}
