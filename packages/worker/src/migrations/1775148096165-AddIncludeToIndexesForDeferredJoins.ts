import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIncludeToIndexesForDeferredJoins1775148096165 implements MigrationInterface {
  name = "AddIncludeToIndexesForDeferredJoins1775148096165";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // transactions — append PK (hash)
    await queryRunner.query(`DROP INDEX "public"."IDX_0d5b5806881e34ed37a37a96a2"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0338c3cd4ddc9e46f78bcf1a4d" ON "transactions" ("fromToMin", "fromToMax", "receivedAt", "transactionIndex", "hash")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_6ea59f03238929aef98674f87d"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7ece2448682a1a44835d6de94d" ON "transactions" ("receivedAt", "transactionIndex", "hash")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_ea74bf1e592f259b3e64884eb7"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_1a94c1868f321a99eb5d565f4e" ON "transactions" ("blockNumber", "receivedAt", "transactionIndex", "hash")`
    );

    // addressTransactions — append FK (transactionHash)
    await queryRunner.query(`DROP INDEX "public"."IDX_b4d30b6cac6431409597b0f480"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d3559297a26ed394738a35fe01" ON "addressTransactions" ("address", "receivedAt", "transactionIndex", "transactionHash")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_fd733e62d93b4ad776eb113677"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ce983acda611d0fb3ee1516db9" ON "addressTransactions" ("address", "blockNumber", "transactionIndex", "transactionHash")`
    );

    // visibleTransactions — append FK (transactionHash)
    await queryRunner.query(`DROP INDEX "public"."IDX_0951097d52fcdc05c871418a23"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d7628a26c44402aad6647ca945" ON "visibleTransactions" ("visibleBy", "receivedAt", "transactionIndex", "transactionHash")`
    );

    // addressVisibleTransactions — append FK (transactionHash)
    await queryRunner.query(`DROP INDEX "public"."IDX_315b7ee8ce9935cb41eb49862c"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5dcfcdb52ff47e2f66a06820b5" ON "addressVisibleTransactions" ("address", "visibleBy", "receivedAt", "transactionIndex", "transactionHash")`
    );

    // transfers — append PK (number)
    await queryRunner.query(`DROP INDEX "public"."IDX_0e9e7b97000e369771bfe87351"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e68fcd513c5da274dd981a0e19" ON "transfers" ("transactionHash", "timestamp", "logIndex" DESC, "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_a870be7457f3f683510a83a66b"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_dd1167612c34e90f191127b0ab" ON "transfers" ("tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC, "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_17cd4abaff93f9d170eecee24f"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8ff25ff4f48c847d0c903966c3" ON "transfers" ("fromToMin", "fromToMax", "isFeeOrRefund", "timestamp", "logIndex" DESC, "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_ae784f6b1cd5d7e46d57abb426"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8422fdcab7fbd9746c441f44e6" ON "transfers" ("fromToMin", "fromToMax", "type", "timestamp", "logIndex" DESC, "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_81191c296b89f6e7bbe819b995"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e45024991e1630dc98b0a637dd" ON "transfers" ("tokenAddress", "blockNumber", "logIndex", "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_22c850c7584a8727b44eb4decf"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_913bb1d2fc87de294a64af8668" ON "transfers" ("transactionHash", "isInternal", "blockNumber", "logIndex", "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_6b29485268b54ac40f41e8bb49"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_10c1795699b25999f83762ca17" ON "transfers" ("isInternal", "blockNumber", "logIndex", "number")`
    );

    // addressTransfers — append FK (transferNumber)
    await queryRunner.query(`DROP INDEX "public"."IDX_c380daa3928098940aec1618b0"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b32c04d10ac95fd4ff64904deb" ON "addressTransfers" ("address", "isFeeOrRefund", "timestamp", "logIndex" DESC, "transferNumber")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_c2ed36b20ba87102b821ff555a"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5e6988d3e154026e28d280a1c1" ON "addressTransfers" ("address", "tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC, "transferNumber")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_aa5a147f1f6a4acde1a13de594"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_351c6bd4d17ee043f8d74023e4" ON "addressTransfers" ("address", "type", "timestamp", "logIndex" DESC, "transferNumber")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_aa3c56addbb167c7d036a7dc1e"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e3fa759aba401af649f788041c" ON "addressTransfers" ("address", "tokenAddress", "blockNumber", "logIndex", "transferNumber")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_e3a14ae1d50aa1835187e4bb4a"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_176290b06c346721b2429ca96f" ON "addressTransfers" ("address", "tokenType", "blockNumber", "logIndex", "transferNumber")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_aba2aae78e735a64d968f1ef3c"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_1bf617786f5c96de2385407d60" ON "addressTransfers" ("address", "isInternal", "blockNumber", "logIndex", "transferNumber")`
    );

    // visibleLogs — append FK (logNumber)
    await queryRunner.query(`DROP INDEX "public"."IDX_e8f7413334423b8549171b3c99"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4018416e0f97ae17942984f4a7" ON "visibleLogs" ("visibleBy", "address", "timestamp", "logIndex" DESC, "logNumber")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_8d414a90da6ffce76ac59e28e1"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5382988536f4cfc702bbce28fb" ON "visibleLogs" ("visibleBy", "transactionHash", "timestamp", "logIndex" DESC, "logNumber")`
    );

    // logs — append PK (number)
    await queryRunner.query(`DROP INDEX "public"."IDX_ebbb1251d0299f223e2d45f98f"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_2f79e4a64c808b7aaa65d2f164" ON "logs" ("address", "blockNumber", "logIndex", "number")`
    );

    await queryRunner.query(`DROP INDEX "public"."LogsAddressTopic1BlockNumberLogIndex"`);
    await queryRunner.query(
      `CREATE INDEX "LogsAddressTopic1BlockNumberLogIndex" ON "logs" ("address", (topics[1]), "blockNumber", "logIndex", "number")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // logs
    await queryRunner.query(`DROP INDEX "public"."LogsAddressTopic1BlockNumberLogIndex"`);
    await queryRunner.query(
      `CREATE INDEX "LogsAddressTopic1BlockNumberLogIndex" ON "logs" ("address", (topics[1]), "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_2f79e4a64c808b7aaa65d2f164"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ebbb1251d0299f223e2d45f98f" ON "logs" ("address", "blockNumber", "logIndex")`
    );

    // visibleLogs
    await queryRunner.query(`DROP INDEX "public"."IDX_5382988536f4cfc702bbce28fb"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8d414a90da6ffce76ac59e28e1" ON "visibleLogs" ("visibleBy", "transactionHash", "timestamp", "logIndex" DESC)`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_4018416e0f97ae17942984f4a7"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e8f7413334423b8549171b3c99" ON "visibleLogs" ("visibleBy", "address", "timestamp", "logIndex" DESC)`
    );

    // addressTransfers
    await queryRunner.query(`DROP INDEX "public"."IDX_1bf617786f5c96de2385407d60"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_aba2aae78e735a64d968f1ef3c" ON "addressTransfers" ("address", "isInternal", "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_176290b06c346721b2429ca96f"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e3a14ae1d50aa1835187e4bb4a" ON "addressTransfers" ("address", "tokenType", "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_e3fa759aba401af649f788041c"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_aa3c56addbb167c7d036a7dc1e" ON "addressTransfers" ("address", "tokenAddress", "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_351c6bd4d17ee043f8d74023e4"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_aa5a147f1f6a4acde1a13de594" ON "addressTransfers" ("address", "type", "timestamp", "logIndex" DESC)`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_5e6988d3e154026e28d280a1c1"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c2ed36b20ba87102b821ff555a" ON "addressTransfers" ("address", "tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC)`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_b32c04d10ac95fd4ff64904deb"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c380daa3928098940aec1618b0" ON "addressTransfers" ("address", "isFeeOrRefund", "timestamp", "logIndex" DESC)`
    );

    // transfers
    await queryRunner.query(`DROP INDEX "public"."IDX_10c1795699b25999f83762ca17"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6b29485268b54ac40f41e8bb49" ON "transfers" ("isInternal", "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_913bb1d2fc87de294a64af8668"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_22c850c7584a8727b44eb4decf" ON "transfers" ("transactionHash", "isInternal", "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_e45024991e1630dc98b0a637dd"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_81191c296b89f6e7bbe819b995" ON "transfers" ("tokenAddress", "blockNumber", "logIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_8422fdcab7fbd9746c441f44e6"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ae784f6b1cd5d7e46d57abb426" ON "transfers" ("fromToMin", "fromToMax", "type", "timestamp", "logIndex" DESC)`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_8ff25ff4f48c847d0c903966c3"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_17cd4abaff93f9d170eecee24f" ON "transfers" ("fromToMin", "fromToMax", "isFeeOrRefund", "timestamp", "logIndex" DESC)`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_dd1167612c34e90f191127b0ab"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a870be7457f3f683510a83a66b" ON "transfers" ("tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC)`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_e68fcd513c5da274dd981a0e19"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0e9e7b97000e369771bfe87351" ON "transfers" ("transactionHash", "timestamp", "logIndex" DESC)`
    );

    // addressVisibleTransactions
    await queryRunner.query(`DROP INDEX "public"."IDX_5dcfcdb52ff47e2f66a06820b5"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_315b7ee8ce9935cb41eb49862c" ON "addressVisibleTransactions" ("address", "visibleBy", "receivedAt", "transactionIndex")`
    );

    // visibleTransactions
    await queryRunner.query(`DROP INDEX "public"."IDX_d7628a26c44402aad6647ca945"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0951097d52fcdc05c871418a23" ON "visibleTransactions" ("visibleBy", "receivedAt", "transactionIndex")`
    );

    // addressTransactions
    await queryRunner.query(`DROP INDEX "public"."IDX_ce983acda611d0fb3ee1516db9"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_fd733e62d93b4ad776eb113677" ON "addressTransactions" ("address", "blockNumber", "transactionIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_d3559297a26ed394738a35fe01"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b4d30b6cac6431409597b0f480" ON "addressTransactions" ("address", "receivedAt", "transactionIndex")`
    );

    // transactions
    await queryRunner.query(`DROP INDEX "public"."IDX_1a94c1868f321a99eb5d565f4e"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ea74bf1e592f259b3e64884eb7" ON "transactions" ("blockNumber", "receivedAt", "transactionIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_7ece2448682a1a44835d6de94d"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6ea59f03238929aef98674f87d" ON "transactions" ("receivedAt", "transactionIndex")`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_0338c3cd4ddc9e46f78bcf1a4d"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0d5b5806881e34ed37a37a96a2" ON "transactions" ("fromToMin", "fromToMax", "receivedAt", "transactionIndex")`
    );
  }
}
