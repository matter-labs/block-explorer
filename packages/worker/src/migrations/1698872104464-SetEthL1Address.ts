import { MigrationInterface, QueryRunner } from "typeorm";

export class SetEthL1Address1698872104464 implements MigrationInterface {
  name = "SetEthL1Address1698872104464";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE tokens SET "l1Address" = decode('0000000000000000000000000000000000000000', 'hex') WHERE tokens."l2Address" = decode('000000000000000000000000000000000000800a', 'hex')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE tokens SET "l1Address" = NULL WHERE tokens."l2Address" = decode('000000000000000000000000000000000000800a', 'hex')`
    );
  }
}
