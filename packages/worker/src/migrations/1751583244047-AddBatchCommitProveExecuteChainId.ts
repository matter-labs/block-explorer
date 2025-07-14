import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBatchCommitProveExecuteChainId1751583244047 implements MigrationInterface {
  name = "AddBatchCommitProveExecuteChainId1751583244047";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" ADD "commitChainId" integer`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "proveChainId" integer`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "executeChainId" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "executeChainId"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "proveChainId"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "commitChainId"`);
  }
}
