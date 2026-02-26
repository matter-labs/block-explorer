import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexForLogAddressTopic11772146793235 implements MigrationInterface {
  name = "AddIndexForLogAddressTopic11772146793235";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX LogsAddressTopic1BlockNumberLogIndex ON public.logs ("address", "topics[1]", "blockNumber", "logIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX LogsAddressTopic1BlockNumberLogIndex`);
  }
}
