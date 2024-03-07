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
        await unitOfWork.useTransaction(async () => {
          const manager = unitOfWork.getTransactionManager();
          expect(manager).toEqual(entityManager);
        });
      });

      it("returns the same entity manager from queryRunner for nested transaction calls", async () => {
        expect.assertions(3);
        await unitOfWork.useTransaction(async () => {
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
        });
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
            unitOfWork.useTransaction(async () => {
              manager1 = unitOfWork.getTransactionManager();
            })
          );

          transactionActions.push(
            unitOfWork.useTransaction(async () => {
              manager2 = unitOfWork.getTransactionManager();
            })
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const emptyAction = async () => {};
    it("connects the query runner", async () => {
      await unitOfWork.useTransaction(emptyAction);
      expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    });

    it("starts the transaction with the specified isolation level", async () => {
      await unitOfWork.useTransaction(emptyAction, null, "SERIALIZABLE");
      expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.startTransaction).toHaveBeenCalledWith("SERIALIZABLE");
    });

    it("starts db commit duration metric", async () => {
      await unitOfWork.useTransaction(emptyAction);
      expect(startDbCommitDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    it("commits the transaction", async () => {
      await unitOfWork.useTransaction(emptyAction);
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it("releases the transaction", async () => {
      await unitOfWork.useTransaction(emptyAction);
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it("stops db commit duration metric", async () => {
      await unitOfWork.useTransaction(emptyAction);
      expect(stopDbCommitDurationMetricMock).toHaveBeenCalledTimes(1);
    });

    describe("when action throws an error", () => {
      const errorAction = () => {
        throw new Error("DB call error");
      };

      it("rollbacks the transaction", async () => {
        expect.assertions(1);

        try {
          await unitOfWork.useTransaction(errorAction);
        } catch {
          expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        }
      });

      it("releases the transaction", async () => {
        try {
          await unitOfWork.useTransaction(errorAction);
        } catch {
          expect(queryRunner.release).toHaveBeenCalledTimes(1);
        }
      });

      it("throws generated error", async () => {
        expect.assertions(2);

        try {
          await unitOfWork.useTransaction(errorAction);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe("DB call error");
        }
      });
    });
  });
});
