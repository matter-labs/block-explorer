import { mock } from "jest-mock-extended";
import { DataSource, QueryRunner } from "typeorm";
import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";
import runMigrations from "./runMigrations";

jest.mock("timers/promises");

const ADVISORY_LOCK_KEY = 1234567;

describe("runMigrations", () => {
  let queryRunner: jest.Mocked<QueryRunner>;
  let connection: jest.Mocked<DataSource>;

  beforeEach(() => {
    queryRunner = mock<QueryRunner>({
      connect: jest.fn().mockResolvedValue(null),
      release: jest.fn().mockResolvedValue(null),
    });
    connection = mock<DataSource>({
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      runMigrations: jest.fn().mockResolvedValue(null),
    });
    (setTimeout as jest.Mock).mockResolvedValue(null);
  });

  it("polls until advisory lock is acquired", async () => {
    queryRunner.query = jest
      .fn()
      .mockResolvedValueOnce([{ pg_try_advisory_lock: false }])
      .mockResolvedValueOnce([{ pg_try_advisory_lock: false }])
      .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
      .mockResolvedValueOnce(null); // pg_advisory_unlock

    await runMigrations(connection, mock<Logger>({ warn: jest.fn(), log: jest.fn() }));

    expect(queryRunner.query).toBeCalledWith("SELECT pg_try_advisory_lock($1)", [ADVISORY_LOCK_KEY]);
    expect(setTimeout).toBeCalledTimes(2);
  });

  it("runs migrations when lock is acquired", async () => {
    queryRunner.query = jest
      .fn()
      .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
      .mockResolvedValueOnce(null); // pg_advisory_unlock

    await runMigrations(connection, mock<Logger>());

    expect(connection.runMigrations).toBeCalledTimes(1);
  });

  it("releases lock and queryRunner after migrations complete", async () => {
    queryRunner.query = jest
      .fn()
      .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
      .mockResolvedValueOnce(null); // pg_advisory_unlock

    await runMigrations(connection, mock<Logger>());

    expect(queryRunner.query).toBeCalledWith("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
    expect(queryRunner.release).toBeCalledTimes(1);
  });

  it("releases lock and queryRunner even if migrations throw", async () => {
    queryRunner.query = jest
      .fn()
      .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
      .mockResolvedValueOnce(null); // pg_advisory_unlock
    connection.runMigrations = jest.fn().mockRejectedValue(new Error("migration failed"));

    await expect(runMigrations(connection, mock<Logger>())).rejects.toThrow("migration failed");

    expect(queryRunner.query).toBeCalledWith("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
    expect(queryRunner.release).toBeCalledTimes(1);
  });
});
