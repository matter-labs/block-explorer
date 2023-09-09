import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTxFromIsL1OriginatedNonceIndex1687886751505 implements MigrationInterface {
  name = "AddTxFromIsL1OriginatedNonceIndex1687886751505";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_79051061f6a7553a524383671d"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f4e63e5ad1ba9d2bbff435613f" ON "transactions" ("from", "isL1Originated", "nonce") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_f4e63e5ad1ba9d2bbff435613f"`);
    await queryRunner.query(`CREATE INDEX "IDX_79051061f6a7553a524383671d" ON "transactions" ("from") `);
  }
}
