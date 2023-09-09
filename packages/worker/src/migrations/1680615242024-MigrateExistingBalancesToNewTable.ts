import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateExistingBalancesToNewTable1680615242024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        INSERT INTO public.balances(
            "createdAt",
            "updatedAt",
            address,
            "tokenAddress",
            "blockNumber",
            balance
        )
        SELECT 
            "createdAt", --createdAt
            "updatedAt", --updatedAt
            address, --address
            decode(REPLACE(balances_data.key, '0x', ''), 'hex'), --tokenAddress
            "blockNumber", --blockNumber
            REPLACE(balances_data.value::text, '"', '') --balance
        FROM public.addresses,
            json_each( public.addresses.balances::json) AS balances_data`);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
