import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBatchSpecificFields1682023871081 implements MigrationInterface {
  name = "RemoveBatchSpecificFields1682023871081";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_96a6875b8c339cc7870a5db578"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "l1BatchTimestamp"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "committedAt"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "executedAt"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "provenAt"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."blocks_status_enum"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "commitTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "executeTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "proveTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "confirmations"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "l1BatchTxIndex"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethCommitTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethExecuteTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethProveTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "confirmations"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "confirmations" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethProveTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethExecuteTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethCommitTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "l1BatchTxIndex" integer`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "confirmations" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "proveTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "executeTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "commitTxHash" bytea`);
    await queryRunner.query(`CREATE TYPE "public"."blocks_status_enum" AS ENUM('sealed', 'verified')`);
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD "status" "public"."blocks_status_enum" NOT NULL DEFAULT 'sealed'`
    );
    await queryRunner.query(`ALTER TABLE "blocks" ADD "provenAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "executedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "committedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "l1BatchTimestamp" integer`);
    await queryRunner.query(`CREATE INDEX "IDX_96a6875b8c339cc7870a5db578" ON "blocks" ("status") `);
  }
}
