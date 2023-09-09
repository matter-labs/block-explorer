import { MigrationInterface, QueryRunner } from "typeorm";

export class ByteaDBTypeForHashValues1677080940561 implements MigrationInterface {
  name = "ByteaDBTypeForHashValues1677080940561";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_ParentHash"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_00d4f3eb491f00ae5bece2a559"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "UQ_00d4f3eb491f00ae5bece2a559e"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "hash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "hash" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "UQ_00d4f3eb491f00ae5bece2a559e" UNIQUE ("hash")`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "UQ_2b984d80c6d4709e1e65247d6c6"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "parentHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "parentHash" bytea`);
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD CONSTRAINT "UQ_2b984d80c6d4709e1e65247d6c6" UNIQUE ("parentHash")`
    );
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "miner"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "miner" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "extraData"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "extraData" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "commitTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "commitTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "executeTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "executeTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "proveTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "proveTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "PK_69b31ba33682e27f43b4754126a"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "address" bytea NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "PK_69b31ba33682e27f43b4754126a" PRIMARY KEY ("address")`
    );
    await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_cf3cf6b059a0a710d026b68a343"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "FK_1236ec3b6419b8e843af9807a07"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_32d1fee33194687356298e56b86"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "PK_6f30cde2f4cf5a630e053758400"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "hash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "hash" bytea NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "PK_6f30cde2f4cf5a630e053758400" PRIMARY KEY ("hash")`
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "to" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "from" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "data"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "data" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "blockHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "blockHash" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethCommitTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethCommitTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethExecuteTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethExecuteTxHash" bytea`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethProveTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethProveTxHash" bytea`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cf3cf6b059a0a710d026b68a34"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "transactionHash" bytea`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f94e870c97029faa5f4fc9f529"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "address" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "data"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "data" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "topics"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "topics" bytea array NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "PK_44561e4a980180b869ae1233274"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "l2Address"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "l2Address" bytea NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "PK_44561e4a980180b869ae1233274" PRIMARY KEY ("l2Address")`
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "l1Address"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "l1Address" bytea`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "transactionHash" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "PK_1236ec3b6419b8e843af9807a07"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "transactionHash" bytea NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "PK_1236ec3b6419b8e843af9807a07" PRIMARY KEY ("transactionHash")`
    );
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "to" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "from" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "contractAddress"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "contractAddress" bytea`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "root"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "root" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "logsBloom"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "logsBloom" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "blockHash"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "blockHash" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "from" bytea NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "to" bytea NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c4133312072d8f3064e441c82b"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "transactionHash" bytea`);
    await queryRunner.query(`DROP INDEX "public"."IDX_226e4cb415878b814f472ba02d"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "tokenAddress"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "tokenAddress" bytea`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_00d4f3eb491f00ae5bece2a559" ON "blocks" ("hash") `);
    await queryRunner.query(`CREATE INDEX "IDX_cf3cf6b059a0a710d026b68a34" ON "logs" ("transactionHash") `);
    await queryRunner.query(`CREATE INDEX "IDX_f94e870c97029faa5f4fc9f529" ON "logs" ("address") `);
    await queryRunner.query(`CREATE INDEX "IDX_c4133312072d8f3064e441c82b" ON "transfers" ("transactionHash") `);
    await queryRunner.query(`CREATE INDEX "IDX_226e4cb415878b814f472ba02d" ON "transfers" ("tokenAddress") `);
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_ParentHash" FOREIGN KEY ("parentHash") REFERENCES "blocks"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_cf3cf6b059a0a710d026b68a343" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_32d1fee33194687356298e56b86" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "FK_1236ec3b6419b8e843af9807a07" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "FK_1236ec3b6419b8e843af9807a07"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_32d1fee33194687356298e56b86"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_cf3cf6b059a0a710d026b68a343"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_ParentHash"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_226e4cb415878b814f472ba02d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c4133312072d8f3064e441c82b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f94e870c97029faa5f4fc9f529"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cf3cf6b059a0a710d026b68a34"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_00d4f3eb491f00ae5bece2a559"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "tokenAddress"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "tokenAddress" character(42)`);
    await queryRunner.query(`CREATE INDEX "IDX_226e4cb415878b814f472ba02d" ON "transfers" ("tokenAddress") `);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "transactionHash" character(66)`);
    await queryRunner.query(`CREATE INDEX "IDX_c4133312072d8f3064e441c82b" ON "transfers" ("transactionHash") `);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "to" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "from" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "blockHash"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "blockHash" character(66) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "logsBloom"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "logsBloom" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "root"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "root" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "contractAddress"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "contractAddress" character(42)`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "from" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "to" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "PK_1236ec3b6419b8e843af9807a07"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ADD "transactionHash" character(66) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "PK_1236ec3b6419b8e843af9807a07" PRIMARY KEY ("transactionHash")`
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "transactionHash" character(66) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "l1Address"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "l1Address" character(42)`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "PK_44561e4a980180b869ae1233274"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "l2Address"`);
    await queryRunner.query(`ALTER TABLE "tokens" ADD "l2Address" character(42) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "PK_44561e4a980180b869ae1233274" PRIMARY KEY ("l2Address")`
    );
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "topics"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "topics" character(66) array NOT NULL`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "data"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "data" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "address" character(42) NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_f94e870c97029faa5f4fc9f529" ON "logs" ("address") `);
    await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "transactionHash"`);
    await queryRunner.query(`ALTER TABLE "logs" ADD "transactionHash" character(66)`);
    await queryRunner.query(`CREATE INDEX "IDX_cf3cf6b059a0a710d026b68a34" ON "logs" ("transactionHash") `);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethProveTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethProveTxHash" character(66)`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethExecuteTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethExecuteTxHash" character(66)`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "ethCommitTxHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "ethCommitTxHash" character(66)`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "blockHash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "blockHash" character(66) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "data"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "data" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "from" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "to" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "PK_6f30cde2f4cf5a630e053758400"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "hash"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "hash" character(66) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "PK_6f30cde2f4cf5a630e053758400" PRIMARY KEY ("hash")`
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_32d1fee33194687356298e56b86" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "FK_1236ec3b6419b8e843af9807a07" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_cf3cf6b059a0a710d026b68a343" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "PK_69b31ba33682e27f43b4754126a"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "address" character(42) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "PK_69b31ba33682e27f43b4754126a" PRIMARY KEY ("address")`
    );
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "proveTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "proveTxHash" character(66)`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "executeTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "executeTxHash" character(66)`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "commitTxHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "commitTxHash" character(66)`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "extraData"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "extraData" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "miner"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "miner" character(42) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "UQ_2b984d80c6d4709e1e65247d6c6"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "parentHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "parentHash" character(66)`);
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD CONSTRAINT "UQ_2b984d80c6d4709e1e65247d6c6" UNIQUE ("parentHash")`
    );
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "UQ_00d4f3eb491f00ae5bece2a559e"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP COLUMN "hash"`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD "hash" character(66) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "UQ_00d4f3eb491f00ae5bece2a559e" UNIQUE ("hash")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_00d4f3eb491f00ae5bece2a559" ON "blocks" ("hash") `);
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_ParentHash" FOREIGN KEY ("parentHash") REFERENCES "blocks"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
