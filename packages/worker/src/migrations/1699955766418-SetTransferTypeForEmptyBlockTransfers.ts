import { MigrationInterface, QueryRunner } from "typeorm";

export class SetTransferTypeForEmptyBlockTransfers1699955766418 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            WITH "updatedTransferNumbers" AS 
                (
                    UPDATE transfers 
                    SET "type" = 'transfer', "isFeeOrRefund" = false, "isInternal" = true
                    WHERE "transactionHash" IS NULL
                    RETURNING number
                )
            UPDATE "addressTransfers"
            SET "isFeeOrRefund" = false, "isInternal" = true
            FROM "updatedTransferNumbers"
            WHERE "transferNumber" = "updatedTransferNumbers"."number"
        `);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
