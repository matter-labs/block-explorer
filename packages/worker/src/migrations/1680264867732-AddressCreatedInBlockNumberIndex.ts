import { MigrationInterface, QueryRunner } from "typeorm";

export class AddressCreatedInBlockNumberIndex1680264867732 implements MigrationInterface {
  name = "AddressCreatedInBlockNumberIndex1680264867732";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_ac13a40a9b8db62625a6eeb051" ON "addresses" ("createdInBlockNumber") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_ac13a40a9b8db62625a6eeb051"`);
  }
}
