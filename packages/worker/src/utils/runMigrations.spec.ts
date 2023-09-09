import { mock } from "jest-mock-extended";
import { DataSource } from "typeorm";
import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";
import runMigrations from "./runMigrations";

const CREATE_LOCK_TABLE_SQL = "CREATE TABLE _lock (id bigint NOT NULL, PRIMARY KEY (id))";
const DROP_LOCK_TABLE_SQL = "DROP TABLE _lock";

jest.mock("timers/promises");

describe("runMigrations", () => {
  it("tries to create a lock table periodically until succeeds", async () => {
    const connection = mock<DataSource>({
      query: jest
        .fn()
        .mockRejectedValueOnce("Db already exists")
        .mockRejectedValueOnce("Db already exists")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      runMigrations: jest.fn().mockResolvedValueOnce(null),
    });
    (setTimeout as jest.Mock).mockResolvedValue(null);

    await runMigrations(connection, mock<Logger>({ warn: jest.fn(), log: jest.fn() }));

    expect(connection.query).toBeCalledTimes(4);
    expect(connection.query).toBeCalledWith(CREATE_LOCK_TABLE_SQL);
    expect(setTimeout).toBeCalledTimes(2);
  });

  it("runs migrations when lock table is created", async () => {
    const connection = mock<DataSource>({
      query: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
      runMigrations: jest.fn().mockResolvedValueOnce(null),
    });

    await runMigrations(connection, mock<Logger>());

    expect(connection.runMigrations).toBeCalledTimes(1);
    expect(connection.runMigrations).toBeCalledWith();
  });

  it("removes lock table after migrations are executed", async () => {
    const connection = mock<DataSource>({
      query: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
      runMigrations: jest.fn().mockResolvedValueOnce(null),
    });

    await runMigrations(connection, mock<Logger>());

    expect(connection.query).toBeCalledTimes(2);
    expect(connection.query).toBeCalledWith(DROP_LOCK_TABLE_SQL);
  });
});
