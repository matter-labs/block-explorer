# ZKsync Era Block Explorer API
## Overview

`ZKsync Era Block Explorer API` is a block explorer API for ZKsync Era blockchain.
The service provides API for retrieving structured ZKsync Era blockchain data. It must be connected to the [Block explorer Worker](/packages/worker) database.

There are 2 sets of endpoints the service provides. All the endpoints under `/api/*` are designed for external direct usage. These endpoints are similar to [Etherscan API](https://docs.etherscan.io) endpoints. The development of these endpoints is in progress, so more of them will be added soon. The other set of endpoints (other than `/api/*`) is designed to be used by the front-end [App](/packages/app) only and is not meant to be used externally. Once all the new `/api/*` endpoints are developed all the other endpoints (other than `/api/*`) will be deprecated and removed.

## Installation

```bash
$ npm install
```

## Setting up env variables

- Create `.env` file in the `api` package folder and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- Set up env variables for Worker Postgres database connection. By default it points to `postgres://postgres:postgres@localhost:5432/block-explorer`.
You need to have a running Worker database, for instructions on how to run the worker service see [Block explorer Worker](/packages/worker). Set the following env variables to point the service to your worker database:
  - `DATABASE_URL`
  - `DATABASE_REPLICA_URL_<<replica_index>>`
  - `DATABASE_CONNECTION_IDLE_TIMEOUT_MS`
  - `DATABASE_CONNECTION_POOL_SIZE`
- Set `CONTRACT_VERIFICATION_API_URL` to your verification API URL. For ZKsync Era testnet use `https://zksync2-testnet-explorer.zksync.dev`. For ZKsync Era mainnet - `https://zksync2-mainnet-explorer.zksync.io`.

## Custom base token configuration
For networks with a custom base token, there are a number of environment variables used to configure custom base and ETH tokens:
- `BASE_TOKEN_L1_ADDRESS` - required, example: `0xB44A106F271944fEc1c27cd60b8D6C8792df86d8`. Base token L1 address can be fetched using the RPC call:
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
- `BASE_TOKEN_SYMBOL` - required, example: `ZK`
- `BASE_TOKEN_NAME` - required, example: `ZK`
- `BASE_TOKEN_DECIMALS` - required, example: `18`
- `BASE_TOKEN_LIQUIDITY` -  optional, example: `20000`
- `BASE_TOKEN_ICON_URL` - optional, example: `https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266`
- `BASE_TOKEN_USDPRICE` - optional, example: `3300.30`.

- `ETH_TOKEN_L2_ADDRESS` - required, example: `0x642C0689b87dEa060B9f0E2e715DaB8564840861`. Eth L2  address can be calculated using SDK:
  ```
  import { utils, Provider } from "zksync-ethers";

  async function main() {
      const l2provider = new Provider("http://localhost:3050");
      const ethL2Address = await l2provider.l2TokenAddress(utils.ETH_ADDRESS);
      console.log('ethL2Address', ethL2Address);
  }
  main()
      .then()
      .catch((error) => {
          console.error(error);
          process.exitCode = 1;
      });
  ```
- `ETH_TOKEN_NAME` - optional, default is `Ether`
- `ETH_TOKEN_SYMBOL` - optional, default is `ETH`
- `ETH_TOKEN_DECIMALS` - optional, default is `18`
- `ETH_TOKEN_LIQUIDITY` - optional, example: `20000`
- `ETH_TOKEN_ICON_URL` - optional, default (ETH icon) is: `https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266`
- `ETH_TOKEN_USDPRICE` - optional, example: `3300.30`.

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

## Docs
Locally Swagger docs are available at http://localhost:3020/docs. JSON version - http://localhost:3020/docs-json.

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
* local

Feel free to add other API requests to the config if anything is missing. Keep in mind that performance tests may affect the running environment or/and any of its dependencies.

To output performance results to a file use next command:
```
artillery run ./performance/load-test.yaml -e testnet -o ./performance/29-06/testnet.json
```

for more command options check [official artillery docs](https://www.artillery.io/docs).


## Production links
 - [Testnet](https://block-explorer-api.testnets.zksync.dev)
 - [Mainnet](https://block-explorer-api.mainnet.zksync.io)
