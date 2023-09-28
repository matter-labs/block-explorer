# The test solution for Block Explorer API (Transaction processing)

Based on Jest.io/TypeScript/TDD.

## Recommended pre-test setup

Before the execution of tests there needs to install all NodeJS dependencies:

```bash
npm install
```

## How to prepare a local environment

Pre-requisites: Docker Desktop should be installed

Before the test run, there needs to spin a local environment up:
```bash
docker-compose -f docker-compose.yaml up
```

## How to run tests
--
all tests:

```bash
npm run test 
```

If there is a necessity to run the exact test or/and suite you need change 
key-words from "it" to "fit" (for the test) and "describe" to "fdescribe" for suite.

If you want to exclude some test/suites, there needs change keywords "it" to "xit" and/or
"describe" to "xdescribe"


The presented logic/code (/utils, /deploy, /contracts) of custom ERC20 token deployment has been taking from
JackHamer09/zkSync-2.0-Hardhat-example repository.  