import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTransactionsIndexes1775063540019 implements MigrationInterface {
  name = "UpdateTransactionsIndexes1775063540019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9228143efe55cf142e861bc502"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1f9ba40f27ea5b5179e8c45ac2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c954af638c99003126575112ad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1635dac1e1b877b7b2f9f65aef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f8b841e005e13e12008d9778ed"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0d5b5806881e34ed37a37a96a2" ON "transactions" ("fromToMin", "fromToMax", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e6e7c912525e72be8f297c643" ON "visibleTransactions" ("transactionHash", "visibleBy") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0951097d52fcdc05c871418a23" ON "visibleTransactions" ("visibleBy", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_315b7ee8ce9935cb41eb49862c" ON "addressVisibleTransactions" ("address", "visibleBy", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd733e62d93b4ad776eb113677" ON "addressTransactions" ("address", "blockNumber", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4d30b6cac6431409597b0f480" ON "addressTransactions" ("address", "receivedAt", "transactionIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_b4d30b6cac6431409597b0f480"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fd733e62d93b4ad776eb113677"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_315b7ee8ce9935cb41eb49862c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0951097d52fcdc05c871418a23"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e6e7c912525e72be8f297c643"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0d5b5806881e34ed37a37a96a2"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f8b841e005e13e12008d9778ed" ON "addressTransactions" ("address", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1635dac1e1b877b7b2f9f65aef" ON "addressVisibleTransactions" ("address", "visibleBy", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c954af638c99003126575112ad" ON "visibleTransactions" ("visibleBy", "blockNumber", "receivedAt", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f9ba40f27ea5b5179e8c45ac2" ON "visibleTransactions" ("transactionHash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9228143efe55cf142e861bc502" ON "transactions" ("transactionIndex", "blockNumber", "receivedAt", "fromToMin", "fromToMax") `
    );
  }
}
