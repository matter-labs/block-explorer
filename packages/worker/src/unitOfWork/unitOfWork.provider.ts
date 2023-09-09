import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { DataSource, EntityManager, QueryRunner } from "typeorm";
import { DB_COMMIT_DURATION_METRIC_NAME } from "../metrics";
import { AsyncLocalStorage } from "node:async_hooks";

export declare type IsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";

@Injectable()
export class UnitOfWork {
  private readonly logger: Logger;
  private readonly asyncLocalStorage: AsyncLocalStorage<{ queryRunner: QueryRunner }>;

  public constructor(
    @InjectMetric(DB_COMMIT_DURATION_METRIC_NAME)
    private readonly dbCommitDurationMetric: Histogram,
    private readonly dataSource: DataSource,
    private readonly entityManager: EntityManager
  ) {
    this.logger = new Logger(UnitOfWork.name);
    this.asyncLocalStorage = new AsyncLocalStorage();
  }

  public getTransactionManager(): EntityManager {
    const store = this.asyncLocalStorage.getStore();
    const queryRunner = store?.queryRunner;
    return queryRunner?.manager || this.entityManager;
  }

  public async useTransaction(
    action: () => Promise<void>,
    logContext?: Record<string, string | number>,
    isolationLevel?: IsolationLevel
  ): Promise<void> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await this.asyncLocalStorage.run(
      {
        queryRunner,
      },
      async () => {
        await queryRunner.connect();
        await queryRunner.startTransaction(isolationLevel);

        try {
          await action();

          this.logger.debug({ message: "Committing the transaction", ...logContext });
          const stopDbCommitDurationMeasuring = this.dbCommitDurationMetric.startTimer();
          await queryRunner.commitTransaction();
          stopDbCommitDurationMeasuring();
        } catch (error) {
          this.logger.error(
            { message: "Error while processing the transaction. Rolling back", ...logContext },
            error.stack
          );
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          this.logger.debug({ message: "Releasing the unit of work", ...logContext });
          await queryRunner.release();
        }
      }
    );
  }
}
