import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateOldETHBalancesToNewAddress1685422448610 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // we don't need to store balances for 0x00 address since we won't even show it on UI
    await queryRunner.query(`
            DELETE FROM public.balances WHERE address = decode('0000000000000000000000000000000000000000', 'hex')
        `);

    // ETH balances tokenAddress was 0x00 then it became 0x800A. We need to migrated old balances and set new
    // tokenAddress to store and return only one value. It was agreed that it should be 0x800A.
    await queryRunner.query(`
            UPDATE public.balances SET "tokenAddress" = decode('000000000000000000000000000000000000800A', 'hex')
            WHERE "tokenAddress" = decode('0000000000000000000000000000000000000000', 'hex')
        `);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
