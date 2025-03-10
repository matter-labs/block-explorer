import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeeProof1738237731890 implements MigrationInterface {
  name = "AddTeeProof1738237731890";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" ADD "teeProvenAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "teeAttestation" bytea`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "teeSignature" bytea`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "teeStatus" bytea`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "teePubkey" bytea`);
    await queryRunner.query(`ALTER TABLE "batches" ADD "teeType" character varying(32)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "teeType"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "teePubkey"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "teeStatus"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "teeSignature"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "teeAttestation"`);
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "teeProvenAt"`);
  }
}
