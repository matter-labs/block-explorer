import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeAddressBytecodeFieldRequired1680184877961 implements MigrationInterface {
  name = "MakeAddressBytecodeFieldRequired1680184877961";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "bytecode" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "bytecode" DROP NOT NULL`);
  }
}
