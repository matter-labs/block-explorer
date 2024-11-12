# ZKsync Era Block Explorer Data Fetcher
## Overview

`ZKsync Era Block Explorer Data Fetcher` service exposes and implements an HTTP endpoint to retrieve aggregated data for a certain block / range of blocks from the blockchain. This endpoint is called by the [Block Explorer Worker](/packages/worker) service.

## Installation

```bash
$ yarn install
```

## Setting up env variables

- Create `.env` file in the `data-fetcher` package folder and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- In order to tell the service where to get the blockchain data from set the value of the `BLOCKCHAIN_RPC_URL` env var to your blockchain RPC API URL. For ZKsync Era testnet it can be set to `https://sepolia.era.zksync.dev`. For ZKsync Era mainnet - `https://mainnet.era.zksync.io`.

## Running the app

```bash
# development
$ yarn dev

# watch mode
$ yarn dev:watch

# debug mode
$ yarn dev:debug

# production mode
$ yarn start
```

## Test

```bash
# unit tests
$ yarn test

# unit tests debug mode
$ yarn test:debug

# test coverage
$ yarn test:cov
```

## Development

### Linter
Run `yarn lint` to make sure the code base follows configured linter rules.
