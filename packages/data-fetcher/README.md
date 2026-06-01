# ZKsync Era Block Explorer Data Fetcher
## Overview

`ZKsync Era Block Explorer Data Fetcher` service exposes and implements an HTTP endpoint to retrieve aggregated data for a certain block / range of blocks from the blockchain. This endpoint is called by the [Block Explorer Worker](/packages/worker) service.

## Installation

```bash
$ npm install
```

## Setting up env variables

- Create `.env` file in the `data-fetcher` package folder and copy paste `.env.example` content in there.
```
cp .env.example .env
```
- In order to tell the service where to get the blockchain data from set the value of the `BLOCKCHAIN_RPC_URL` env var to your blockchain RPC API URL. For ZKsync Era testnet it can be set to `https://sepolia.era.zksync.dev`. For ZKsync Era mainnet - `https://mainnet.era.zksync.io`.
- Legacy bridge events (`FinalizeDeposit` / `WithdrawalInitiated`) are only indexed when emitted by a trusted bridge: the canonical bridges reported by `zks_getBridgeContracts` plus any addresses listed in the optional `TRUSTED_LEGACY_BRIDGE_ADDRESSES` env var (comma-separated). Add legitimate third-party/custom token bridges there so their transfers are not dropped — for ZKsync Era mainnet this should include at least the Lido wstETH bridge `0xe1d6a50e7101c8f8db77352897ee3f1ac53f782b`. Skipped emitters are counted by the `skipped_untrusted_legacy_bridge_logs_total` metric.

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
