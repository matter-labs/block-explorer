import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInternalTransactions1765309986723 implements MigrationInterface {
  name = "CreateInternalTransactions1765309986723";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "internalTransactions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "transactionHash" bytea NOT NULL, "blockNumber" bigint NOT NULL, "from" bytea NOT NULL, "to" bytea, "value" character varying(128) NOT NULL, "gas" character varying(128), "gasUsed" character varying(128), "input" bytea, "output" bytea, "type" character varying NOT NULL, "callType" character varying, "traceAddress" character varying NOT NULL, "traceIndex" integer NOT NULL, "error" character varying, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_a46bc9d7978d37eb8eefac36378" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_662829b3af89e7ce1cff554cb8" ON "internalTransactions" ("to") `);
    await queryRunner.query(`CREATE INDEX "IDX_2f67257239c7138f69ae980b14" ON "internalTransactions" ("from") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_5f97e1c4e1f4469fb14951bed4" ON "internalTransactions" ("type", "blockNumber", "traceIndex") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99b671da329251da22ef5bc2ca" ON "internalTransactions" ("transactionHash", "traceAddress") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0488107e29b286a1f690542c26" ON "internalTransactions" ("blockNumber", "traceIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_855b4da178caeffc35d1c9d2ea" ON "internalTransactions" ("timestamp", "traceIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aade1d13024297ff2b3eade2f5" ON "internalTransactions" ("transactionHash", "traceIndex") `
    );
    await queryRunner.query(
      `CREATE TABLE "addressInternalTransactions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "number" BIGSERIAL NOT NULL, "transactionHash" bytea NOT NULL, "traceAddress" character varying NOT NULL, "address" bytea NOT NULL, "blockNumber" bigint NOT NULL, "timestamp" TIMESTAMP NOT NULL, "traceIndex" integer NOT NULL, CONSTRAINT "PK_783da235d7717c558fd185eb824" PRIMARY KEY ("number"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_caf79b11d43060eba55764878d" ON "addressInternalTransactions" ("transactionHash") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08b397bc1f1ba8840c130379ad" ON "addressInternalTransactions" ("blockNumber") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c5d2da7c0b8f6a6ffcd1372bf" ON "addressInternalTransactions" ("transactionHash", "traceAddress") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_787824d1c547ddd41743273e5b" ON "addressInternalTransactions" ("address", "timestamp", "blockNumber", "traceIndex") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2db80a263cfdba7f216dd3297" ON "addressInternalTransactions" ("address", "blockNumber", "traceIndex") `
    );
    await queryRunner.query(
      `ALTER TABLE "internalTransactions" ADD CONSTRAINT "FK_c406de6f2bc327af45299a9767e" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "internalTransactions" ADD CONSTRAINT "FK_37222eca13ba6b1bdff7b37e521" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addressInternalTransactions" ADD CONSTRAINT "FK_6c5d2da7c0b8f6a6ffcd1372bf7" FOREIGN KEY ("transactionHash", "traceAddress") REFERENCES "internalTransactions"("transactionHash","traceAddress") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "addressInternalTransactions" DROP CONSTRAINT "FK_6c5d2da7c0b8f6a6ffcd1372bf7"`
    );
    await queryRunner.query(`ALTER TABLE "internalTransactions" DROP CONSTRAINT "FK_37222eca13ba6b1bdff7b37e521"`);
    await queryRunner.query(`ALTER TABLE "internalTransactions" DROP CONSTRAINT "FK_c406de6f2bc327af45299a9767e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2db80a263cfdba7f216dd3297"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_787824d1c547ddd41743273e5b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6c5d2da7c0b8f6a6ffcd1372bf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_08b397bc1f1ba8840c130379ad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_caf79b11d43060eba55764878d"`);
    await queryRunner.query(`DROP TABLE "addressInternalTransactions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aade1d13024297ff2b3eade2f5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_855b4da178caeffc35d1c9d2ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0488107e29b286a1f690542c26"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_99b671da329251da22ef5bc2ca"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5f97e1c4e1f4469fb14951bed4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2f67257239c7138f69ae980b14"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_662829b3af89e7ce1cff554cb8"`);
    await queryRunner.query(`DROP TABLE "internalTransactions"`);
  }
}
