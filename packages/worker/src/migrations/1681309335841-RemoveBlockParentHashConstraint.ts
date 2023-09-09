import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBlockParentHashConstraint1681309335841 implements MigrationInterface {
  name = "RemoveBlockParentHashConstraint1681309335841";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_ParentHash"`);
    await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "UQ_2b984d80c6d4709e1e65247d6c6"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD CONSTRAINT "UQ_2b984d80c6d4709e1e65247d6c6" UNIQUE ("parentHash")`
    );
    await queryRunner.query(
      `ALTER TABLE "blocks" ADD CONSTRAINT "FK_ParentHash" FOREIGN KEY ("parentHash") REFERENCES "blocks"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
