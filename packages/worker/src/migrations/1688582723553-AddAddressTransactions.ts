import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressTransactions1688582723553 implements MigrationInterface {
  name = "AddAddressTransactions1688582723553";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "addressTransactions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "transactionHash" bytea NOT NULL, "address" bytea NOT NULL, "blockNumber" bigint NOT NULL, "receivedAt" TIMESTAMP NOT NULL, "transactionIndex" integer NOT NULL, CONSTRAINT "PK_bff95313b612d469b24715faded" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f47df88074738e8a6080e9bfc" ON "addressTransactions" ("transactionHash") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_420e0bedaf4efe5b913ce0eb58" ON "addressTransactions" ("blockNumber") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_b4d30b6cac6431409597b0f480" ON "addressTransactions" ("address", "receivedAt", "transactionIndex") `
    );

    await queryRunner.query(
      `ALTER TABLE "addressTransactions" ADD CONSTRAINT "FK_4f47df88074738e8a6080e9bfc0" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addressTransactions" ADD CONSTRAINT "FK_420e0bedaf4efe5b913ce0eb587" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(`INSERT INTO "addressTransactions"(
                "transactionHash",
                "address",
                "blockNumber",
                "receivedAt",
                "transactionIndex"
            )
            SELECT 
                "hash",
                "from",
                "blockNumber",
                "receivedAt",
                "transactionIndex"
            FROM "transactions" `);
    await queryRunner.query(`INSERT INTO "addressTransactions"(
                "transactionHash",
                "address",
                "blockNumber",
                "receivedAt",
                "transactionIndex"
            )
            SELECT 
                "hash",
                "to",
                "blockNumber",
                "receivedAt",
                "transactionIndex"
            FROM "transactions" WHERE "from" != "to"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_da0af10ab2ac8430a51a371fd1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9738f201ba50810be605cab392"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2fdb5277f14e26e749075fcdd7"`);
    await queryRunner.query(`CREATE INDEX "IDX_a629587e749dda5721fed9a5c3" ON "transactions" ("blockNumber") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_6ea59f03238929aef98674f87d" ON "transactions" ("receivedAt", "transactionIndex") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addressTransactions" DROP CONSTRAINT "FK_420e0bedaf4efe5b913ce0eb587"`);
    await queryRunner.query(`ALTER TABLE "addressTransactions" DROP CONSTRAINT "FK_4f47df88074738e8a6080e9bfc0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ea59f03238929aef98674f87d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a629587e749dda5721fed9a5c3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b4d30b6cac6431409597b0f480"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_420e0bedaf4efe5b913ce0eb58"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4f47df88074738e8a6080e9bfc"`);
    await queryRunner.query(`DROP TABLE "addressTransactions"`);
    await queryRunner.query(`CREATE INDEX "IDX_2fdb5277f14e26e749075fcdd7" ON "transactions" ("to") `);
    await queryRunner.query(`CREATE INDEX "IDX_9738f201ba50810be605cab392" ON "transactions" ("receivedAt") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_da0af10ab2ac8430a51a371fd1" ON "transactions" ("blockNumber", "transactionIndex") `
    );
  }
}
