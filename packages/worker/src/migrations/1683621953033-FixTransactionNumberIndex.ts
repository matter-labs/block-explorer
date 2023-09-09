import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTransactionNumberIndex1683621953033 implements MigrationInterface {
  name = "FixTransactionNumberIndex1683621953033";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_23368dc6dbdbe92f83c8bb1fd8"`);
    await queryRunner.query(`CREATE INDEX "IDX_23368dc6dbdbe92f83c8bb1fd8" ON "transactions" ("number") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_23368dc6dbdbe92f83c8bb1fd8"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23368dc6dbdbe92f83c8bb1fd8" ON "transactions" ("number") `);
  }
}
