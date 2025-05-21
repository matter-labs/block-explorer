import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesForLogsTopics1746557256883 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX LogsTopic1 on public.logs ((topics[2]));`);
    await queryRunner.query(`CREATE INDEX LogsTopic2 on public.logs ((topics[3]));`);
    await queryRunner.query(`CREATE INDEX LogsTopic3 on public.logs ((topics[4]));`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX LogsTopic1 on public.logs;`);
    await queryRunner.query(`DROP INDEX LogsTopic2 on public.logs;`);
    await queryRunner.query(`DROP INDEX LogsTopic3 on public.logs;`);
  }
}
