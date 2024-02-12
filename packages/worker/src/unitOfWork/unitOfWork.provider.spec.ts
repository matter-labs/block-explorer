import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { DataSource, QueryRunner, EntityManager } from "typeorm";
import { UnitOfWork } from ".";

describe("UnitOfWork", () => {
  let unitOfWork: UnitOfWork;
  let queryRunner: QueryRunner;
  let startDbCommitDurationMetricMock: jest.Mock;
  let stopDbCommitDurationMetricMock: jest.Mock;
  let dataSourceMock: DataSource;
  let defaultEntityManagerMock: EntityManager;
  let entityManager;

  beforeEach(async () => {
    defaultEntityManagerMock = mock<EntityManager>();

    entityManager = {
      transactionId: 123,
    };

    queryRunner = mock<QueryRunner>({
      manager: entityManager,
    });

    dataSourceMock = mock<DataSource>();
    stopDbCommitDurationMetricMock = jest.fn();
    startDbCommitDurationMetricMock = jest.fn().mockReturnValue(stopDbCommitDurationMetricMock);

    jest.spyOn(dataSourceMock, "createQueryRunner").mockReturnValue(queryRunner);

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        UnitOfWork,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: EntityManager,
          useValue: defaultEntityManagerMock,
        },
        {
          provide: "PROM_METRIC_DB_COMMIT_DURATION_SECONDS",
          useValue: {
            startTimer: startDbCommitDurationMetricMock,
          },
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    unitOfWork = app.get<UnitOfWork>(UnitOfWork);
  });

  describe("getTransactionManager", () => {
    describe("when UnitOfWork instance has queryRunner in scope", () => {
      it("returns entity manager from queryRunner", async () => {
        expect.assertions(1);
        await unitOfWork
          .useTransaction(async () => {
            const manager = unitOfWork.getTransactionManager();
            expect(manager).toEqual(entityManager);
          })
          .waitForExecution();
      });

      it("returns the same entity manager from queryRunner for nested transaction calls", async () => {
        expect.assertions(3);
        await unitOfWork
          .useTransaction(async () => {
            const manager1 = unitOfWork.getTransactionManager();
            expect(manager1).toEqual(entityManager);

            await (async () => {
              const manager2 = unitOfWork.getTransactionManager();
              expect(manager2).toEqual(entityManager);

              await (async () => {
                const manager3 = unitOfWork.getTransactionManager();
                expect(manager3).toEqual(entityManager);
              })();
            })();
          })
          .waitForExecution();
      });

      describe("when there are multiple concurrent transactions", () => {
        let queryRunner1;
        let queryRunner2;
        const entityManager1 = mock<EntityManager>();
        const entityManager2 = mock<EntityManager>();

        beforeEach(() => {
          queryRunner1 = mock<QueryRunner>({
            manager: entityManager1,
          });
          queryRunner2 = mock<QueryRunner>({
            manager: entityManager2,
          });
          jest.spyOn(dataSourceMock, "createQueryRunner").mockReturnValueOnce(queryRunner1);
          jest.spyOn(dataSourceMock, "createQueryRunner").mockReturnValueOnce(queryRunner2);
        });

        it("returns different entity managers for different transactions", async () => {
          expect.assertions(2);
          const transactionActions: Promise<void>[] = [];

          let manager1;
          let manager2;

          transactionActions.push(
            unitOfWork
              .useTransaction(async () => {
                manager1 = unitOfWork.getTransactionManager();
              })
              .waitForExecution()
          );

          transactionActions.push(
            unitOfWork
              .useTransaction(async () => {
                manager2 = unitOfWork.getTransactionManager();
              })
              .waitForExecution()
          );
          await Promise.all(transactionActions);

          expect(manager1).toEqual(entityManager1);
          expect(manager2).toEqual(entityManager2);
        });
      });
    });

    describe("when UnitOfWork instance has no queryRunner in scope", () => {
      it("returns default entity manager", async () => {
        expect.assertions(1);
        const manager = unitOfWork.getTransactionManager();
        expect(manager).toEqual(defaultEntityManagerMock);
      });
    });
  });

  describe("useTransaction", () => {
    const emptyAction = jest.fn().mockResolvedValue(null);
    it("connects the query runner", async () => {
      const transaction = unitOfWork.useTransaction(emptyAction);
      await transaction.waitForExecution();
      expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    });

    it("starts the transaction with the specified isolation level", async () => {
      const transaction = unitOfWork.useTransaction(emptyAction, false, null, "SERIALIZABLE");
      await transaction.waitForExecution();
      expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.startTransaction).toHaveBeenCalledWith("SERIALIZABLE");
    });

    describe("when preventAutomaticCommit is set to false", () => {
      it("starts db commit duration metric", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction);
        await transaction.waitForExecution();
        expect(startDbCommitDurationMetricMock).toHaveBeenCalledTimes(1);
      });

      it("commits the transaction", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction);
        await transaction.waitForExecution();
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      });

      it("releases the transaction", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction);
        await transaction.waitForExecution();
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
      });

      it("stops db commit duration metric", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction);
        await transaction.waitForExecution();
        expect(stopDbCommitDurationMetricMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when preventAutomaticCommit is set to true", () => {
      it("does not commit transaction automatically", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction, true);
        await transaction.waitForExecution();
        expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      });

      it("commits transaction when commit is called from outside", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction, true);
        await transaction.waitForExecution();
        await transaction.commit();
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      });

      it("reverts transaction when ensureRollbackIfNotCommitted is called from outside", async () => {
        const transaction = unitOfWork.useTransaction(emptyAction, true);
        await transaction.waitForExecution();
        await transaction.ensureRollbackIfNotCommitted();
        expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      });
    });

    it("throws an error when commit is called for already committed transaction", async () => {
      const transaction = unitOfWork.useTransaction(emptyAction);
      await transaction.waitForExecution();
      await expect(transaction.commit()).rejects.toThrowError(
        new Error("The transaction cannot be committed as it connection is released")
      );
    });

    it("does not try to rollback already committed transaction", async () => {
      const transaction = unitOfWork.useTransaction(emptyAction);
      await transaction.waitForExecution();
      await transaction.ensureRollbackIfNotCommitted();
      expect(queryRunner.rollbackTransaction).not.toBeCalled();
    });

    describe("when action throws an error", () => {
      const error = new Error("DB call error");
      const errorAction = jest.fn().mockRejectedValue(error);

      it("rollbacks the transaction", async () => {
        const transaction = unitOfWork.useTransaction(errorAction);
        await Promise.allSettled([transaction.waitForExecution()]);
        expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      });

      it("releases the transaction", async () => {
        const transaction = unitOfWork.useTransaction(errorAction);
        await Promise.allSettled([transaction.waitForExecution()]);
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
      });

      it("throws generated error", async () => {
        const transaction = unitOfWork.useTransaction(errorAction);
        await expect(transaction.waitForExecution()).rejects.toThrowError(error);
      });
    });

    describe("when commit transaction fails", () => {
      beforeEach(() => {
        jest.spyOn(queryRunner, "commitTransaction").mockRejectedValue(new Error("Failed to commit"));
      });

      it("rollbacks the transaction", async () => {
        const transaction = unitOfWork.useTransaction(jest.fn());
        await Promise.allSettled([transaction.waitForExecution()]);
        expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      });

      it("releases the transaction", async () => {
        const transaction = unitOfWork.useTransaction(jest.fn());
        await Promise.allSettled([transaction.waitForExecution()]);
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
      });

      it("throws error", async () => {
        const transaction = unitOfWork.useTransaction(jest.fn());
        await expect(transaction.waitForExecution()).rejects.toThrowError(new Error("Failed to commit"));
      });
    });
  });
});
