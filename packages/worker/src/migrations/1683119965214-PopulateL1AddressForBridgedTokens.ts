import { MigrationInterface, QueryRunner } from "typeorm";

export class PopulateL1AddressForBridgedTokens1683119965214 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE public.tokens SET 
                "l1Address" = decode(SUBSTRING(encode(public.logs.topics[2], 'hex'), 25), 'hex'),
                "updatedAt" = CURRENT_TIMESTAMP
            FROM public.logs
            WHERE 
                public.logs.topics[1] = decode('81e8e92e5873539605a102eddae7ed06d19bea042099a437cbc3644415eb7404', 'hex')
                AND 
                public.logs.address = public.tokens."l2Address"
        `);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
