# Integration tests for for Block Explorer UI and API

Based on Jest.io/TypeScript/TDD.

## Installation

```bash
npm install
```

## How to prepare a local environment

Pre-requisites: Docker Desktop should be installed

Before the test run you need to spin up a local environment (use docker-compose.yaml from the root project):
```bash
docker-compose -f ../../docker-compose.yaml up
```

## How to run api tests
--
all tests:

```bash
npm run integration-test:api 
```
## How to run ui tests
--
all tests:

```bash
npm run integration-test:ui 
```

If there is a necessity to run the exact test or/and suite you need change 
key-words from "it" to "fit" (for the test) and "describe" to "fdescribe" for suite.

If you want to exclude some test/suites, you need to change keywords "it" to "xit" and/or
"describe" to "xdescribe"

The test solution contains two main folders: [src](./src) and [tests](./tests).
[src](./src) folder contains: 
- essential [scenarios](./src/playbook/scenarios/)
- predefined [entities](./src/entities.ts) and [config](./src/config.ts) config files
- [contracts](./src/playbook/contracts/) folder with a set of contracts
- [deploy](./src/playbook/deploy/) folder with a set of deploy scripts
- [buffer](./src/playbook/buffer/) folder as a temporary storage of transaction hashes and addresses 
- [utils](./src/playbook/utils/) folder with utils scripts

[tests](./tests) folder contains sets of:
- [api](./tests/api/) endpoints tests, that cover an essential part of [worker](../packages/worker/) and [api](../packages/api/) functionality
- [ui](./tests/ui/) UI tests. that cover an essential part of [Block explorer](../packages/app/) functionality


For more details, follow this documentation https://era.zksync.io/docs/.  