import { run } from "./base";

export default async () =>
  run(async (dataSource) => {
    const { DATABASE_URL } = process.env;
    const databaseName = DATABASE_URL.split("/").pop();
    await dataSource.query(`CREATE DATABASE "${databaseName}";`);
  });
