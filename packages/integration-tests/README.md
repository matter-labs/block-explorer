# Integration tests for for Block Explorer UI and API

Based on Jest.io/TypeScript/TDD.

## Installation

```bash
npm install
```

## Setting up env variables

- Create `.env` file in the `integration-tests/src/playbook/` package folder and copy paste `.env.example` content in there.
```
cp .env.example packages/integration-tests/src/playbook/.env
```

- Add your private wallet key to `WALLET_PRIVATE_KEY=` By default we use `richWalletPrivateKey` private key in `integration-tests/src/playbook/hardhat.config.ts` from `integration-tests/src/entities.ts`. 

## Preparing a local environment

Make sure you have `Docker` installed. Before running the tests you need to spin up a local environment (use `docker-compose.yaml` from the root directory):
```bash
docker-compose up
```

## Running API tests
--
all tests:

```bash
npm run integration-test:api 
```
## Running UI tests
--
all tests:

```bash
npm run integration-test:ui 
```

If you need to run the exact test or/and suite you can change 
key-words from `it` to `fit` (for the test) and `describe` to `fdescribe` for suite.

If you need to exclude some specific test/suites, you can change keywords `it` to `xit` and/or
`describe` to `xdescribe`.

The test solution contains two main folders: [src](./src) and [tests](./tests).
[src](./src) folder contains: 
- essential [scenarios](./src/playbook/scenarios/)
- predefined [entities](./src/entities.ts) and [config](./src/config.ts) config files
- [contracts](./src/playbook/contracts/) folder with a set of contracts
- [deploy](./src/playbook/deploy/) folder with a set of deploy scripts
- [buffer](./src/playbook/buffer/) folder as a temporary storage of transaction hashes and addresses 
- [utils](./src/playbook/utils/) folder with utils scripts

[tests](./tests) folder contains sets of:
- [api](./tests/api/) endpoints tests, which cover essential part of [worker](../packages/worker/) and [api](../packages/api/) functionality
- [ui](./tests/ui/) UI tests, which cover essential part of [Block explorer](../packages/app/) functionality
