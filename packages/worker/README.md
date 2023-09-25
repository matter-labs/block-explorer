# zkSync Era Block Explorer Worker
## Description

`zkSync Era Block Explorer Worker` is an indexer service for zkSync Era blockchain data. The purpose of the service is to read the data from the blockchain in real time, transform it and fill in it's database with the data in a way that makes it easy to read by the [Block explorer API](https://github.com/matter-labs/block-explorer-api).

## Installation

```bash
$ npm install
```

## Setting up env variables

- Create `.env` file in the `worker` package folder and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- In order to tell the service where to get the blockchain data from set the value of the `BLOCKCHAIN_RPC_URL` env var to your blockchain RPC API URL. For zkSync Era testnet it can be set to `https://zksync2-testnet.zksync.dev`. For zkSync Era mainnet can be set to `https://zksync2-mainnet.zksync.io`.
- Set up env variables for Postgres database connection. By default it points to `localhost:5432` and database name is `block-explorer`.
You need to have a running Postgres server, set the following env variables to point the service to your database:
  - `DATABASE_HOST`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_NAME`
  - `DATABASE_CONNECTION_IDLE_TIMEOUT_MS`
  - `DATABASE_CONNECTION_POOL_SIZE`

## Running the app

```bash
# development
$ npm run dev

# watch mode
$ npm run dev:watch

# debug mode
$ npm run dev:debug

# production mode
$ npm run start
```

## Running the app in Docker
There is a docker compose configuration that allows you to run Block Explorer Worker and all its dependencies in docker. Just run the following command to spin up the whole environment:
```
docker-compose up
```
It will run local Ethereum node, ZkSync Era, Postgres DB and Block Explorer Worker.

## Test

```bash
# unit tests
$ npm run test

# unit tests debug mode
$ npm run test:debug

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Development

### Linter
Run `npm run lint` to make sure the code base follows configured linter rules.

### DB changes
Changes to the DB are stored as migrations scripts in `src/migrations` folder and are automatically executed on the application start.

We use _code first_ approach for managing DB schema so desired schema changes should be first applied to the Entity classes and then migrations scripts can be generated running the following command: `migration:generate`.

Example:

```
npm run migration:generate -name=AddStatusColumnToTxTable
```

a new migration with the specified name and all schema changes will be generated in `src/migration` folder. Always check generated migrations to confirm that they have everything you intended.

Sometimes you need to write a manual migration script not generated based on any schema changes. For instance, to run a script to update some records. In this case use `migration:create` to create an empty migration.

Example:

```
npm run migration:create -name=UpdateTxsFee
```

this command will simply create an empty migration where the custom migration logic can be added.

### Conventional Commits
We follow the Conventional Commits [specification](https://www.conventionalcommits.org/en/v1.0.0/#specification).
