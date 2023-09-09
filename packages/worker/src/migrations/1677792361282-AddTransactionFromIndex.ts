import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionFromIndex1677792361282 implements MigrationInterface {
  name = "AddTransactionFromIndex1677792361282";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_79051061f6a7553a524383671d" ON "transactions" ("from") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_79051061f6a7553a524383671d"`);
  }
}
