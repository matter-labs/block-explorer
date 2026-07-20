import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateIndexesToUseBlockNumber1776337238413 implements MigrationInterface {
  name = "UpdateIndexesToUseBlockNumber1776337238413";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0338c3cd4ddc9e46f78bcf1a4d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7ece2448682a1a44835d6de94d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1a94c1868f321a99eb5d565f4e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d7628a26c44402aad6647ca945"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_98f7030b89509e25e434fb2e93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_90ca67f84ee01d5122f5de5454"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_382f446361db1f82055eae989a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4018416e0f97ae17942984f4a7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5382988536f4cfc702bbce28fb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e68fcd513c5da274dd981a0e19"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dd1167612c34e90f191127b0ab"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8ff25ff4f48c847d0c903966c3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8422fdcab7fbd9746c441f44e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5dcfcdb52ff47e2f66a06820b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b32c04d10ac95fd4ff64904deb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e6988d3e154026e28d280a1c1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_351c6bd4d17ee043f8d74023e4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d3559297a26ed394738a35fe01"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8511a8471c95a377eca9349607" ON "transactions" ("fromToMin", "fromToMax", "blockNumber", "transactionIndex", "hash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16b1ae8aabd813427137d9a3cf" ON "transactions" ("blockNumber", "transactionIndex", "hash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07082b24e6c3ee9d853fbb01b1" ON "visibleTransactions" ("visibleBy", "blockNumber", "transactionIndex", "transactionHash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f231a894a9e6548055c7ccab83" ON "logs" ("transactionHash", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5a0d05f3c68802aa9328284a4" ON "logs" ("address", "transactionFrom", "blockNumber", "logIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_286530b44cbdadc876c1dc75e8" ON "visibleLogs" ("visibleBy", "transactionHash", "blockNumber", "logIndex", "logNumber") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af2874900597989329ef780fa0" ON "visibleLogs" ("visibleBy", "address", "blockNumber", "logIndex", "logNumber") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a84a9e06418fe5eec84262490" ON "transfers" ("fromToMin", "fromToMax", "type", "blockNumber", "logIndex", "number") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a031cd7319b2db3ed123f0e5e5" ON "transfers" ("fromToMin", "fromToMax", "isFeeOrRefund", "blockNumber", "logIndex", "number") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4391bdaefe0dc08e103ffca3b9" ON "transfers" ("tokenAddress", "isFeeOrRefund", "blockNumber", "logIndex", "number") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b70fc615f32230a8880962ff51" ON "transfers" ("transactionHash", "blockNumber", "logIndex", "number") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c53586c2e1c9b894bc3aceb75f" ON "addressVisibleTransactions" ("address", "visibleBy", "blockNumber", "transactionIndex", "transactionHash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70f5c1b36ee5878215830b086e" ON "addressTransfers" ("address", "type", "blockNumber", "logIndex", "transferNumber") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9cc2ed6755e46794f09410aa8" ON "addressTransfers" ("address", "tokenAddress", "isFeeOrRefund", "blockNumber", "logIndex", "transferNumber") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_708ade5bae30018c7601290440" ON "addressTransfers" ("address", "isFeeOrRefund", "blockNumber", "logIndex", "transferNumber") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_708ade5bae30018c7601290440"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f9cc2ed6755e46794f09410aa8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_70f5c1b36ee5878215830b086e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c53586c2e1c9b894bc3aceb75f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b70fc615f32230a8880962ff51"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4391bdaefe0dc08e103ffca3b9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a031cd7319b2db3ed123f0e5e5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a84a9e06418fe5eec84262490"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_af2874900597989329ef780fa0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_286530b44cbdadc876c1dc75e8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a5a0d05f3c68802aa9328284a4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f231a894a9e6548055c7ccab83"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_07082b24e6c3ee9d853fbb01b1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_16b1ae8aabd813427137d9a3cf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8511a8471c95a377eca9349607"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0338c3cd4ddc9e46f78bcf1a4d" ON "transactions" ("fromToMin", "fromToMax", "receivedAt", "transactionIndex", "hash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ece2448682a1a44835d6de94d" ON "transactions" ("receivedAt", "transactionIndex", "hash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a94c1868f321a99eb5d565f4e" ON "transactions" ("blockNumber", "receivedAt", "transactionIndex", "hash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7628a26c44402aad6647ca945" ON "visibleTransactions" ("visibleBy", "receivedAt", "transactionIndex", "transactionHash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98f7030b89509e25e434fb2e93" ON "logs" ("transactionHash", "timestamp", "logIndex" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90ca67f84ee01d5122f5de5454" ON "logs" ("address", "timestamp", "logIndex" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_382f446361db1f82055eae989a" ON "logs" ("address", "transactionFrom", "timestamp", "logIndex" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4018416e0f97ae17942984f4a7" ON "visibleLogs" ("visibleBy", "address", "timestamp", "logIndex" DESC, "logNumber")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5382988536f4cfc702bbce28fb" ON "visibleLogs" ("visibleBy", "transactionHash", "timestamp", "logIndex" DESC, "logNumber")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e68fcd513c5da274dd981a0e19" ON "transfers" ("transactionHash", "timestamp", "logIndex" DESC, "number")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd1167612c34e90f191127b0ab" ON "transfers" ("tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC, "number")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ff25ff4f48c847d0c903966c3" ON "transfers" ("fromToMin", "fromToMax", "isFeeOrRefund", "timestamp", "logIndex" DESC, "number")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8422fdcab7fbd9746c441f44e6" ON "transfers" ("fromToMin", "fromToMax", "type", "timestamp", "logIndex" DESC, "number")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5dcfcdb52ff47e2f66a06820b5" ON "addressVisibleTransactions" ("address", "visibleBy", "receivedAt", "transactionIndex", "transactionHash")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b32c04d10ac95fd4ff64904deb" ON "addressTransfers" ("address", "isFeeOrRefund", "timestamp", "logIndex" DESC, "transferNumber")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e6988d3e154026e28d280a1c1" ON "addressTransfers" ("address", "tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC, "transferNumber")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_351c6bd4d17ee043f8d74023e4" ON "addressTransfers" ("address", "type", "timestamp", "logIndex" DESC, "transferNumber")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d3559297a26ed394738a35fe01" ON "addressTransactions" ("address", "receivedAt", "transactionIndex", "transactionHash")`
    );
  }
}
