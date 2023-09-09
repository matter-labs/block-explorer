import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressTransfers1687918830335 implements MigrationInterface {
  name = "AddAddressTransfers1687918830335";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_tmp_transfers_type" ON "transfers" ("type") `);
    await queryRunner.query(`ALTER TABLE "transfers" ADD "isFeeOrRefund" boolean NOT NULL DEFAULT FALSE`);
    await queryRunner.query(`UPDATE "transfers" SET "isFeeOrRefund" = TRUE WHERE "type" IN ('fee', 'refund') `);
    await queryRunner.query(`ALTER TABLE "transfers" ALTER COLUMN "isFeeOrRefund" DROP DEFAULT`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tmp_transfers_type"`);

    await queryRunner.query(
      `CREATE TABLE "addressTransfers" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "transferNumber" bigint NOT NULL, "address" bytea NOT NULL, "blockNumber" bigint NOT NULL, "timestamp" TIMESTAMP NOT NULL, "isFeeOrRefund" boolean NOT NULL, "logIndex" integer NOT NULL, CONSTRAINT "PK_7e3560fda9d203e4fcf10bd2335" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_3b5bd7be245ef82949c1d6b2f7" ON "addressTransfers" ("transferNumber") `);
    await queryRunner.query(`CREATE INDEX "IDX_f7e8b7e5f35f01339f757048d9" ON "addressTransfers" ("blockNumber") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_c380daa3928098940aec1618b0" ON "addressTransfers" ("address", "isFeeOrRefund", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `ALTER TABLE "addressTransfers" ADD CONSTRAINT "FK_3b5bd7be245ef82949c1d6b2f79" FOREIGN KEY ("transferNumber") REFERENCES "transfers"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addressTransfers" ADD CONSTRAINT "FK_f7e8b7e5f35f01339f757048d9b" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(`INSERT INTO "addressTransfers"(
            "transferNumber",
            "address",
            "blockNumber",
            "timestamp",
            "isFeeOrRefund",
            "logIndex"
        )
        SELECT 
            "number",
            "from",
            "blockNumber",
            "timestamp",
            "isFeeOrRefund",
            "logIndex"
        FROM "transfers" `);
    await queryRunner.query(`INSERT INTO "addressTransfers"(
            "transferNumber",
            "address",
            "blockNumber",
            "timestamp",
            "isFeeOrRefund",
            "logIndex"
        )
        SELECT 
            "number",
            "to",
            "blockNumber",
            "timestamp",
            "isFeeOrRefund",
            "logIndex"
        FROM "transfers" WHERE "from" != "to"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_c4133312072d8f3064e441c82b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ac2bd9363bf7a75242fe12632"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_53a5b7b9a8b63afe25e0251971"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fb035f3e76dd463d87a71289d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_58b65a9f96fb3ad879f67b8406"`);

    await queryRunner.query(
      `CREATE INDEX "IDX_a870be7457f3f683510a83a66b" ON "transfers" ("tokenAddress", "isFeeOrRefund", "timestamp", "logIndex" DESC) `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e9e7b97000e369771bfe87351" ON "transfers" ("transactionHash", "timestamp", "logIndex" DESC) `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP CONSTRAINT "FK_f7e8b7e5f35f01339f757048d9b"`);
    await queryRunner.query(`ALTER TABLE "addressTransfers" DROP CONSTRAINT "FK_3b5bd7be245ef82949c1d6b2f79"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0e9e7b97000e369771bfe87351"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a870be7457f3f683510a83a66b"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "isFeeOrRefund"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c380daa3928098940aec1618b0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f7e8b7e5f35f01339f757048d9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3b5bd7be245ef82949c1d6b2f7"`);
    await queryRunner.query(`DROP TABLE "addressTransfers"`);
    await queryRunner.query(`CREATE INDEX "IDX_58b65a9f96fb3ad879f67b8406" ON "transfers" ("tokenAddress", "type") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_fb035f3e76dd463d87a71289d6" ON "transfers" ("to", "type", "timestamp") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_53a5b7b9a8b63afe25e0251971" ON "transfers" ("from", "type", "timestamp") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ac2bd9363bf7a75242fe12632" ON "transfers" ("blockNumber", "logIndex") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_c4133312072d8f3064e441c82b" ON "transfers" ("transactionHash") `);
  }
}
