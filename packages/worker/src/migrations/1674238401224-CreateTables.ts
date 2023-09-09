import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1674238401224 implements MigrationInterface {
  name = "CreateTables1674238401224";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."blocks_status_enum" AS ENUM('sealed', 'verified')`);
    await queryRunner.query(
      `CREATE TABLE "blocks" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" bigint NOT NULL, "hash" character(66) NOT NULL, "parentHash" character(66) NOT NULL, "timestamp" integer NOT NULL, "nonce" character varying NOT NULL, "difficulty" integer NOT NULL, "_difficulty" character varying(128) NOT NULL, "gasLimit" character varying(128) NOT NULL, "gasUsed" character varying(128) NOT NULL, "baseFeePerGas" character varying(128) NOT NULL, "miner" character(42) NOT NULL, "extraData" character varying NOT NULL, "l1BatchNumber" bigint, "l1BatchTimestamp" integer, "commitTxHash" character(66), "committedAt" TIMESTAMP, "executeTxHash" character(66), "executedAt" TIMESTAMP, "l1TxCount" integer NOT NULL, "l2TxCount" integer NOT NULL, "proveTxHash" character(66), "provenAt" TIMESTAMP, "status" "public"."blocks_status_enum" NOT NULL DEFAULT 'sealed', CONSTRAINT "PK_5c0b8f5cedabb33e58a625f8a7e" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_96a6875b8c339cc7870a5db578" ON "blocks" ("status") `);
    await queryRunner.query(
      `CREATE TABLE "addresses" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "address" character(42) NOT NULL, "blockNumber" bigint NOT NULL, "balances" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_69b31ba33682e27f43b4754126a" PRIMARY KEY ("address"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'included', 'verified', 'failed')`
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "hash" character(66) NOT NULL, "to" character(42) NOT NULL, "from" character(42) NOT NULL, "nonce" bigint NOT NULL, "transactionIndex" integer NOT NULL, "gasLimit" character varying(128) NOT NULL, "gasPrice" character varying(128) NOT NULL, "maxFeePerGas" character varying(128), "maxPriorityFeePerGas" character varying(128), "data" character varying NOT NULL, "value" character varying(128) NOT NULL, "chainId" integer NOT NULL, "blockNumber" bigint NOT NULL, "blockHash" character(66) NOT NULL, "timestamp" integer, "confirmations" integer NOT NULL, "type" integer NOT NULL, "accessList" jsonb, "l1BatchNumber" bigint, "l1BatchTxIndex" integer, "ethCommitTxHash" character(66), "ethExecuteTxHash" character(66), "ethProveTxHash" character(66), "fee" character varying NOT NULL, "isL1Originated" boolean NOT NULL, "receivedAt" TIMESTAMP NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_6f30cde2f4cf5a630e053758400" PRIMARY KEY ("hash"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da0af10ab2ac8430a51a371fd1" ON "transactions" ("blockNumber", "transactionIndex") `
    );
    await queryRunner.query(
      `CREATE TABLE "logs" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "blockNumber" bigint NOT NULL, "transactionHash" character(66), "transactionIndex" integer NOT NULL, "removed" boolean, "address" character(42) NOT NULL, "data" character varying NOT NULL, "topics" character(66) array NOT NULL, "logIndex" integer NOT NULL, CONSTRAINT "PK_36bce79ebd6dc60ae57e2382ae7" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(
      `CREATE TABLE "transactionReceipts" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "transactionHash" character(66) NOT NULL, "to" character(42) NOT NULL, "from" character(42) NOT NULL, "contractAddress" character(42), "transactionIndex" integer NOT NULL, "type" integer NOT NULL, "root" character varying NOT NULL, "gasUsed" character varying(128) NOT NULL, "effectiveGasPrice" character varying(128) NOT NULL, "logsBloom" character varying NOT NULL, "blockHash" character(66) NOT NULL, "blockNumber" bigint NOT NULL, "confirmations" integer NOT NULL, "cumulativeGasUsed" character varying(128) NOT NULL, "byzantium" boolean NOT NULL, "status" integer NOT NULL, CONSTRAINT "PK_1236ec3b6419b8e843af9807a07" PRIMARY KEY ("transactionHash"))`
    );
    await queryRunner.query(
      `CREATE TABLE "tokens" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "l2Address" character(42) NOT NULL, "l1Address" character(42), "number" BIGSERIAL NOT NULL, "symbol" character varying NOT NULL, "name" character varying NOT NULL, "decimals" integer NOT NULL, "blockNumber" bigint NOT NULL, "transactionHash" character(66) NOT NULL, CONSTRAINT "CHK_6a3b312a8c9c24b217fe84ce0c" CHECK ("symbol" <> ''), CONSTRAINT "PK_44561e4a980180b869ae1233274" PRIMARY KEY ("l2Address"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_435f738cb042dc9ad18b4c0fea" ON "tokens" ("number") `);
    await queryRunner.query(
      `CREATE TYPE "public"."transfers_type_enum" AS ENUM('deposit', 'transfer', 'withdrawal', 'fee', 'mint')`
    );
    await queryRunner.query(
      `CREATE TABLE "transfers" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "from" character(42) NOT NULL, "to" character(42) NOT NULL, "blockNumber" bigint NOT NULL, "transactionHash" character(66), "amount" character varying(128), "tokenAddress" character(42), "type" "public"."transfers_type_enum" NOT NULL DEFAULT 'transfer', "fields" jsonb, CONSTRAINT "PK_552edbef9f4e89a2331a6aae09b" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_e13ab0f8b91a6788a2604404f1" ON "transfers" ("from") `);
    await queryRunner.query(`CREATE INDEX "IDX_0689c81f39710fe137c65fe3be" ON "transfers" ("to") `);
    await queryRunner.query(`CREATE INDEX "IDX_c4133312072d8f3064e441c82b" ON "transfers" ("transactionHash") `);
    await queryRunner.query(`CREATE INDEX "IDX_226e4cb415878b814f472ba02d" ON "transfers" ("tokenAddress") `);
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_8e47038e522aacf546f17733581" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a629587e749dda5721fed9a5c39" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_802e133f929cd9a9e0db73ed7ff" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_cf3cf6b059a0a710d026b68a343" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "FK_1236ec3b6419b8e843af9807a07" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "FK_78b6dc1fe9600ba7de18fec1273" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_5165fcd06a6954903a1d5f52015" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_32d1fee33194687356298e56b86" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_730b817608cd0ed733d5b548373" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_730b817608cd0ed733d5b548373"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_32d1fee33194687356298e56b86"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_5165fcd06a6954903a1d5f52015"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "FK_78b6dc1fe9600ba7de18fec1273"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "FK_1236ec3b6419b8e843af9807a07"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_cf3cf6b059a0a710d026b68a343"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_802e133f929cd9a9e0db73ed7ff"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a629587e749dda5721fed9a5c39"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_8e47038e522aacf546f17733581"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_226e4cb415878b814f472ba02d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c4133312072d8f3064e441c82b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0689c81f39710fe137c65fe3be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e13ab0f8b91a6788a2604404f1"`);
    await queryRunner.query(`DROP TABLE "transfers"`);
    await queryRunner.query(`DROP TYPE "public"."transfers_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_435f738cb042dc9ad18b4c0fea"`);
    await queryRunner.query(`DROP TABLE "tokens"`);
    await queryRunner.query(`DROP TABLE "transactionReceipts"`);
    await queryRunner.query(`DROP TABLE "logs"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_da0af10ab2ac8430a51a371fd1"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_96a6875b8c339cc7870a5db578"`);
    await queryRunner.query(`DROP TABLE "blocks"`);
    await queryRunner.query(`DROP TYPE "public"."blocks_status_enum"`);
  }
}
