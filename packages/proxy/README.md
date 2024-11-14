# Double zero block explorer proxy

Proxy meant to add authorization in data returned by explorer.

## Prepare

The proxy can be configured with a few environment variables:

- `NODE_ENV`: environment for node js. It can be `production` or `development`.
- `SERVER_PORT`: port where the proxy is going to run.
- `BLOCK_EXPLORER_API_URL`: url for the real block explorer api.
- `SESSION_SECRET`: 32 bytes expressed in hex.
- `CORS_ORIGIN`: url where the app is going to run.

For development this can ben easily configured by doing:

``` bash
cp example.env .env
```

## Dev

To run the proxy in development mode:

``` bash
yarn dev
```

## Build

``` bash
yarn build
```

## Test
``` bash
yarn test
```

## Prod start

``` bash
yarb start
```