import { MigrationInterface, QueryRunner } from "typeorm";
import { deleteOldBalancesScript } from "../repositories/balance.repository";

export class DeleteOldBalances1682512427377 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(deleteOldBalancesScript, [0, 0]);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
