<h1 align="center">zkSync Era Block Explorer</h1>

<p align="center">Online blockchain browser for viewing and analyzing <a href="https://zksync.io">zkSync Era</a> blockchain.</p>

## 📌 Overview
This repository is a monorepo consisting of 3 packages:
- [Worker](./packages/worker) - an indexer service for [zkSync Era](https://zksync.io) blockchain data. The purpose of the service is to read the data from the blockchain in real time, transform it and fill in it's database with the data in a way that makes it easy to be queried by the [API](./packages/api) service.
- [API](./packages/api) - a service providing Web API for retrieving structured [zkSync Era](https://zksync.io) blockchain data collected by [Worker](./packages/worker). It connects to the Worker's database to be able to query the collected data.
- [App](./packages/app) - a front-end app providing an easy-to-use interface for users to view and inspect transactions, blocks, contracts and more. It makes requests to the [API](./packages/api) to get the data and presents it in a way that's easy to read and understand.

Also the repository contains [integration-test](./packages/integration-tests) package with a set of API and UI tests. Follow this [Readme](./packages/integration-tests/README.md) for more details.

## 🏛 Architecture
The following diagram illustrates how are the block explorer components connected:

```mermaid
flowchart
  subgraph blockchain[Blockchain]
    Blockchain[zkSync Era JSON-RPC API]
  end

  subgraph explorer[Block explorer]
    Database[("Block explorer DB<br/>(PostgreSQL)")]
    Worker(Worker service)
    API(API service)
    App(App)

    Worker-.Save processed data.->Database
    API-.Query data.->Database
    App-."Request data (HTTP)".->API
    App-."Request data (HTTP)".->Blockchain
  end

  Worker-."Request data (HTTP)".->Blockchain
```

[Worker](./packages/worker) service is responsible for getting data from blockchain using [zkSync Era JSON-RPC API](https://era.zksync.io/docs/api/api.html), processing it and saving into the database. [API](./packages/api) service is connected to the same database where it gets the data from to handle API requests. It performs only read requests to the database. The front-end [App](./packages/app) makes HTTP calls to the Block Explorer [API](./packages/api) to get blockchain data and to the [zkSync Era JSON-RPC API](https://era.zksync.io/docs/api/api.html) for reading contracts, performing transactions etc.

## 🚀 Features

- ✅ View transactions, blocks, transfers and logs.
- ✅ Inspect accounts, contracts, tokens and balances.
- ✅ Verify smart contracts.
- ✅ Interact with smart contracts.
- ✅ Standalone HTTP API.
- ✅ Local node support.

## 📋 Prerequisites

- Ensure you have `node >= 18.0.0` and `npm >= 9.0.0` installed.

## 🛠 Installation

```bash
$ npm install
```

## ⚙️ Setting up env variables

### Manually set up env variables
Make sure you have set up all the necessary env variables. Follow [Setting up env variables for Worker](./packages/worker#setting-up-env-variables) and [Setting up env variables for API](./packages/api#setting-up-env-variables) for instructions. For the [App](./packages/app) package you might want to edit environment config, see [Environment configs](./packages/app#environment-configs).

### Build env variables based on your [zksync-era](https://github.com/matter-labs/zksync-era) local repo setup
Make sure you have [zksync-era](https://github.com/matter-labs/zksync-era) repo set up locally. You must have your environment variables files present in the [zksync-era](https://github.com/matter-labs/zksync-era) repo at `/etc/env/*.env` for the build envs script to work.

The following script sets `.env` files for [Worker](./packages/worker) and [API](./packages/api) packages as well as environment configuration file for [App](./packages/app) package based on your local [zksync-era](https://github.com/matter-labs/zksync-era) repo setup.
```bash
$ npm run hyperchain:configure
```
You can review and edit generated files if you need to change any settings.

## 👨‍💻 Running locally

Before running the solution, make sure you have a database server up and running, you have created a database and set up all the required environment variables.
To create a database run the following command:
```bash
$ npm run db:create
```

To run all the packages (`Worker`, `API` and front-end `App`) in `development` mode run the following command from the root directory.
```bash
$ npm run dev
```

For `production` mode run:
```bash
$ npm run build
$ npm run start
```

Each component can also be started individually. Follow individual packages `README` for details.

## 🐳 Running in Docker
There is a docker compose configuration that allows you to run Block Explorer and all its dependencies in docker. Just run the following command to spin up the whole environment:
```
docker-compose up
```
It will run local Ethereum node, ZkSync Era, Postgres DB and all Block Explorer services.

## ⛓️ Connection to your Hyperchain
To get block-explorer connected to your ZK Stack Hyperchain you need to set up all the the necessary environment and configuration files with your Hyperchain settings. You can use a script to build them. See [Setting up env variables](#%EF%B8%8F-setting-up-env-variables).

## 🔍 Verify Block Explorer is up and running

To verify front-end `App` is running open http://localhost:3010 in your browser. `API` should be available at http://localhost:3020. `Worker` - http://localhost:3001.

## 🕵️‍♂️ Testing
Run unit tests for all packages:
```bash
$ npm run test
```
Run e2e tests for all packages:
```bash
$ npm run test:e2e
```
Run tests for a specific package:
```bash
$ npm run test -w {package}
```
For more details on testing please check individual packages `README`.

## 💻 Conventional Commits
We follow the Conventional Commits [specification](https://www.conventionalcommits.org/en/v1.0.0/#specification).

## 📘 License
zkSync Era Block Explorer is distributed under the terms of either

- Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or <http://opensource.org/licenses/MIT>)

at your option.

## 🔗 Production links
- Testnet API: https://block-explorer-api.testnets.zksync.dev
- Mainnet API: https://block-explorer-api.mainnet.zksync.io
- Testnet App: https://goerli.explorer.zksync.io
- Mainnet App: https://explorer.zksync.io
