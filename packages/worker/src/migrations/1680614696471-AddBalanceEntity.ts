import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBalanceEntity1680614696471 implements MigrationInterface {
  name = "AddBalanceEntity1680614696471";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "balances" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "address" bytea NOT NULL, "tokenAddress" bytea NOT NULL, "blockNumber" bigint NOT NULL, "balance" character varying(128) NOT NULL, CONSTRAINT "PK_31944b3c196600270049b2b7f1f" PRIMARY KEY ("address", "tokenAddress", "blockNumber"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_72541bf4560e938ac13a0e936c" ON "balances" ("blockNumber") `);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "balances" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "balances" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_a24a74fdf520375abc7a7eb1882" FOREIGN KEY ("creatorTxHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "balances" ADD CONSTRAINT "FK_72541bf4560e938ac13a0e936c8" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_c4133312072d8f3064e441c82bb" FOREIGN KEY ("transactionHash") REFERENCES "transactions"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_c4133312072d8f3064e441c82bb"`);
    await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_72541bf4560e938ac13a0e936c8"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_a24a74fdf520375abc7a7eb1882"`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "balances" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "balances" SET NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_72541bf4560e938ac13a0e936c"`);
    await queryRunner.query(`DROP TABLE "balances"`);
  }
}
