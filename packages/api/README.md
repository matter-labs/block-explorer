# zkSync Era Block Explorer API
## Description

`zkSync Era Block Explorer API` is a block explorer API for zkSync Era blockchain.
The service provides API for retrieving structured zkSync Era blockchain data. It must be connected to the [Block explorer Worker](https://github.com/matter-labs/block-explorer-worker) database.

## Installation

```bash
$ npm install
```

## Setting up env variables

- Create `.env` file in the project root and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- Set up env variables for Worker Postgres database connection. By default it points to `postgres://postgres:postgres@localhost:5432/block-explorer`.
You need to have a running Worker database, for instructions on how to run the worker service see [Block explorer Worker](https://github.com/matter-labs/block-explorer-worker). Set the following env variables to point the service to your worker database:
  - `DATABASE_URL`
  - `DATABASE_REPLICA_URL_<<replica_index>>`
  - `DATABASE_CONNECTION_IDLE_TIMEOUT_MS`
  - `DATABASE_CONNECTION_POOL_SIZE`
- Set `CONTRACT_VERIFICATION_API_URL` to `https://zksync2-testnet-explorer.zksync.dev` for zkSync Era testnet. For zkSync Era mainnet: `https://zksync2-mainnet-explorer.zksync.io`.

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# debug mode
$ npm run start:debug

# production mode
$ npm run start:prod
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

### Performance tests
There are number of [artillery](https://www.artillery.io/docs) configs in `/performance` folder. 

`/performance/load-test.yaml` is the load test config that contains requests to all API endpoints. It is used to simulate the number of concurrent users and to reach the desired API RPS.

Before running it, check if the config has desired phases and run it with the following command:

```
artillery run ./performance/load-test.yaml -e <name of the environment>
```

supported environments:
* stage
* testnet
* testnet-prod
* mainnet
* mainnet-prod

Feel free to add other API requests to the config if anything is missing. Keep in mind that performance tests may affect the running environment or/and any of its dependencies.

To output performance results to a file use next command:
```
artillery run ./performance/load-test.yaml -e testnet -o ./performance/29-06/testnet.json
```

for more command options check [official artillery docs](https://www.artillery.io/docs).

### Conventional Commits
We follow the Conventional Commits [specification](https://www.conventionalcommits.org/en/v1.0.0/#specification).