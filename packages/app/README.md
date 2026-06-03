# ZKsync Era Block Explorer App
## Overview
`ZKsync Era Block Explorer App` is a front-end app providing an easy-to-use interface for users to view and inspect transactions, blocks, contracts and more on [ZKsync Era](https://zksync.io) blockchain.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Installation

```bash
$ npm install
```

### Environment configs
Public environment configs are stored in `src/configs` folder and are named as `<appEnvironment>.config.json` where `appEnvironment` is the name of the environment set in `VITE_APP_ENVIRONMENT` env variable.
Currently there are 3 different environments for the project: `local`, `staging` and `production`, each with its corresponding configuration file.

### Adding a new network to the config
In order to change the configuration for the environment, you need to change its configuration file. By default, there are 4 networks configured for the `local` environment: `local`, `stage`, `testnet` and `mainnet`. Your local network might be different from what is configured in `local.config.json` in such case you should edit the config and set correct values for your setup. You can also add new items to the `networks` array and they will automatically appear in the networks dropdown on UI. 

#### Settlement Chains Configuration
Each network can include a `settlementChains` array that defines the settlement
chains available for that network. This configuration allows users to view
transactions and data across different connected chains. When configuring
settlement chains:

- **Order matters**: The currently used settlement chain should be placed
  **last** in the array, as the explorer will default to the last item in the
  list
- Each settlement chain object should include:
  - `explorerUrl`: The URL of the explorer for that chain
  - `name`: Display name for the chain
  - `chainId`: The chain ID of the settlement chain
- If this is not set, then it will default to Ethereum

For a complete example of network configuration including settlement chains, refer to [`production.config.json`](./src/configs/production.config.json).

### Serving the app from a subpath
By default the app is served from the root of the domain (e.g. `https://explorer.example.com/`). To serve it from a subpath (e.g. `https://example.com/explorer/`), there are two options:

- **Build time**: set the `VITE_BASE_PATH` env variable when building (e.g. `VITE_BASE_PATH=/explorer/ npm run build`). This bakes the base path into the build output. It also works for the dev server: `VITE_BASE_PATH=/explorer/ npm run dev`.
- **Container runtime**: the published Docker image is built with a relative base, so the base path can be configured at container start by setting the `BASE_PATH` env variable (e.g. `docker run -e BASE_PATH=/explorer ...`). This injects a `<base>` tag into `index.html` and configures nginx to serve the app under the prefix. No rebuild is needed. `BASE_PATH` must be a plain path prefix consisting of URL path segments (letters, digits, `-`, `_`, `/`), since it is interpolated into an nginx location and rewrite rule.

When the app sits behind a reverse proxy that forwards the subpath prefix to the container (prefix-preserving, e.g. `proxy.example.com/explorer/*` -> `container/explorer/*`), set `BASE_PATH` to that prefix. If the proxy strips the prefix before forwarding, leave `BASE_PATH` unset and note that the app would then generate root-relative URLs which will not work under the proxied subpath, so prefix-preserving proxying is the supported setup.

For contributors: when referencing files from `public/` (e.g. `/images/...`) or building full-page redirect URLs in app code, resolve them through the helpers in [`src/utils/basePath.ts`](./src/utils/basePath.ts) (`publicAsset`, `appUrl`, etc.) instead of hardcoding root-absolute paths. Hardcoded `/...` URLs work at the domain root but silently break subpath deployments.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test
```

### Run End-to-End Tests with [Playwright](https://www.playwright.io/)

```sh
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Production links
 - [Web Application](https://explorer.zksync.io)
 - [Storybook](https://storybook-scan-v2.zksync.dev)


## Verify Block Explorer UI test results in GitHub Actions
GitHub Actions test results are available in:

- `GitHub Actions` --> `Summary` page at the very end of a page.
- Inside of each test run in the log: `Feature on Mainnet + Sepolia` --> `@search` --> `Upload test results to Allure reporter` --> `https://raw.githack.com/matter-labs/block-explorer/gh-pages/_github.run_number_/index.html`
- Directly via a link `https://raw.githack.com/matter-labs/block-explorer/gh-pages/_github.run_number_/index.html` after each PR running. The history of test runs for public view locates in `gh-pages` branch.

In case of 404 page, make sure that the folder with its `github.run_number` exists in the `gh-pages`. If the folder exist, try again in a few minutes as `https://raw.githack.com` needs to update the data. Public report link will be available when the 'Allure Report' job will be succesfully executed.
