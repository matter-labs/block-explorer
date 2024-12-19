import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsEvmLikeField1732834401560 implements MigrationInterface {
  name = "AddIsEvmLikeField1732834401560";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" ADD "isEvmLike" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "isEvmLike"`);
  }
}
