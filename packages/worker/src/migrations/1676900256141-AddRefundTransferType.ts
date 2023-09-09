import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefundTransferType1676900256141 implements MigrationInterface {
  name = "AddRefundTransferType1676900256141";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."transfers_type_enum" RENAME TO "transfers_type_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."transfers_type_enum" AS ENUM('deposit', 'transfer', 'withdrawal', 'fee', 'mint', 'refund')`
    );
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "type" TYPE "public"."transfers_type_enum" USING "type"::"text"::"public"."transfers_type_enum"`
    );
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "type" SET DEFAULT 'transfer'`);
    await queryRunner.query(`DROP TYPE "public"."transfers_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transfers_type_enum_old" AS ENUM('deposit', 'transfer', 'withdrawal', 'fee', 'mint')`
    );
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "type" TYPE "public"."transfers_type_enum_old" USING "type"::"text"::"public"."transfers_type_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "type" SET DEFAULT 'transfer'`);
    await queryRunner.query(`DROP TYPE "public"."transfers_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."transfers_type_enum_old" RENAME TO "transfers_type_enum"`);
  }
}
