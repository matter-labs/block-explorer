import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressTransferType1709722093204 implements MigrationInterface {
  name = "AddAddressTransferType1709722093204";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."addressTransfers_type_enum" AS ENUM('deposit', 'transfer', 'withdrawal', 'fee', 'mint', 'refund')`
    );
    await queryRunner.query(
      `ALTER TABLE "addressTransfers" ADD "type" "public"."addressTransfers_type_enum" NOT NULL DEFAULT 'transfer'`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa5a147f1f6a4acde1a13de594" ON "addressTransfers" ("address", "type", "timestamp", "logIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_aa5a147f1f6a4acde1a13de594"`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."addressTransfers_type_enum"`);
  }
}
