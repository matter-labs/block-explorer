import { MigrationInterface, QueryRunner } from "typeorm";

export class BlockRelationCascadeDelete1683976594958 implements MigrationInterface {
  name = "BlockRelationCascadeDelete1683976594958";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_72541bf4560e938ac13a0e936c8"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a629587e749dda5721fed9a5c39"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_8e47038e522aacf546f17733581"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_5165fcd06a6954903a1d5f52015"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_802e133f929cd9a9e0db73ed7ff"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_730b817608cd0ed733d5b548373"`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "FK_78b6dc1fe9600ba7de18fec1273"`);
    await queryRunner.query(
      `ALTER TABLE "balances" ADD CONSTRAINT "FK_72541bf4560e938ac13a0e936c8" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a629587e749dda5721fed9a5c39" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_ac13a40a9b8db62625a6eeb0512" FOREIGN KEY ("createdInBlockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_5165fcd06a6954903a1d5f52015" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_802e133f929cd9a9e0db73ed7ff" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_730b817608cd0ed733d5b548373" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "FK_78b6dc1fe9600ba7de18fec1273" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" DROP CONSTRAINT "FK_78b6dc1fe9600ba7de18fec1273"`);
    await queryRunner.query(`ALTER TABLE "transfers" DROP CONSTRAINT "FK_730b817608cd0ed733d5b548373"`);
    await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_802e133f929cd9a9e0db73ed7ff"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_5165fcd06a6954903a1d5f52015"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_ac13a40a9b8db62625a6eeb0512"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a629587e749dda5721fed9a5c39"`);
    await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_72541bf4560e938ac13a0e936c8"`);
    await queryRunner.query(
      `ALTER TABLE "transactionReceipts" ADD CONSTRAINT "FK_78b6dc1fe9600ba7de18fec1273" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_730b817608cd0ed733d5b548373" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_802e133f929cd9a9e0db73ed7ff" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_5165fcd06a6954903a1d5f52015" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_8e47038e522aacf546f17733581" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a629587e749dda5721fed9a5c39" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "balances" ADD CONSTRAINT "FK_72541bf4560e938ac13a0e936c8" FOREIGN KEY ("blockNumber") REFERENCES "blocks"("number") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
