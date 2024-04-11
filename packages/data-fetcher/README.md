# ZuluPrime Block Explorer Data Fetcher
## Overview

`ZuluPrime Block Explorer Data Fetcher` service exposes and implements an HTTP endpoint to retrieve aggregated data for a certain block / range of blocks from the blockchain. This endpoint is called by the [Block Explorer Worker](/packages/worker) service.

## Installation

```bash
$ npm install
```

## Setting up env variables

- Create `.env` file in the `data-fetcher` package folder and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- In order to tell the service where to get the blockchain data from set the value of the `BLOCKCHAIN_RPC_URL` env var to your blockchain RPC API URL. For zkSync Era testnet it can be set to `https://zksync2-testnet.zksync.dev`. For zkSync Era mainnet - `https://zksync2-mainnet.zksync.io`.

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

# test coverage
$ npm run test:cov
```

## Development

### Linter
Run `npm run lint` to make sure the code base follows configured linter rules.
