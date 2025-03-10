# ZKsync Era Block Explorer Worker
## Overview

`ZKsync Era Block Explorer Worker` is an indexer service for ZKsync Era blockchain data. It retrieves aggregated data from the [Data Fetcher](/packages/data-fetcher) via HTTP and also directly from the blockchain using [ZKsync Era JSON-RPC API](https://docs.zksync.io/build/api-reference/ethereum-rpc), processes it and saves into the database in a way that makes it easy to read by the [Block Explorer API](/packages/api).

## Installation

```bash
$ npm install
```

## Setting up env variables

- Create `.env` file in the `worker` package folder and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- In order to tell the service where to get the blockchain data from set the value of the `BLOCKCHAIN_RPC_URL` env var to your blockchain RPC API URL. For ZKsync Era testnet it can be set to `https://sepolia.era.zksync.dev`. For ZKsync Era mainnet - `https://mainnet.era.zksync.io`.
- To retrieve aggregated blockchain data for a certain block, the Worker service calls the [Data Fetcher](/packages/data-fetcher) service via HTTP. To specify Data Fetcher URL use `DATA_FETCHER_URL` env variable. By default, it is set to `http://localhost:3040` which is a default value for the local environment.
- Set up env variables for Postgres database connection. By default it points to `localhost:5432` and database name is `block-explorer`.
You need to have a running Postgres server, set the following env variables to point the service to your database:
  - `DATABASE_HOST`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_NAME`
  - `DATABASE_CONNECTION_IDLE_TIMEOUT_MS`
  - `DATABASE_CONNECTION_POOL_SIZE`

The service doesn't create database automatically, you can create database by running the following command:
```bash
$ npm run db:create
```

## Custom base token configuration
For networks with a custom base token, there are a number of environment variables used to configure custom base token:
- `BASE_TOKEN_L1_ADDRESS` - example: `0xB44A106F271944fEc1c27cd60b8D6C8792df86d8`. Base token L1 address can be fetched using the RPC call:
  ```
  curl http://localhost:3050 \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"zks_getBaseTokenL1Address","params":[],"id":1,"jsonrpc":"2.0"}'
  ```
  or SDK:
  ```
  import { Provider } from "zksync-ethers";

  async function main() {
      const l2provider = new Provider("http://localhost:3050");
      const baseTokenAddress = await l2provider.getBaseTokenContractAddress();
      console.log('baseTokenAddress', baseTokenAddress);
  }
  main()
      .then()
      .catch((error) => {
          console.error(error);
          process.exitCode = 1;
      });
  ```
- `BASE_TOKEN_SYMBOL` - base token symbol, e.g.: `ZK`
- `BASE_TOKEN_NAME` - base token name, e.g.: `ZK`
- `BASE_TOKEN_DECIMALS` - base token decimals, e.g.: `18`
- `BASE_TOKEN_ICON_URL` - base token icon url, e.g.: `https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266`

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