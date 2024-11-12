# Double Zero

Double zero is a set of services to add authentication and authorization to a ZKsync
compatible chain.

## Run

The easiest way to run the services is using docker compose.

There are 3 different compose configurations:

### Full local 

This is a configuration that spawns a local
eth node and a local zksync node and indexes everything from those local chains.

``` shell
docker compose -f compose-local.yaml up
```

Navigating to [http://localhost:3010](http://localhost:3010) will show the explorer.

 
### Proxy mode

This configuration does not rust the worker to index  explorer data. 
Instead it hits a explorer api URL provided via configuration.

It can be configured changing the file `proxy.env`. For example, this
is the configuration to proxy to mainnet:

``` .env
TARGET_RPC="https://mainnet.era.zksync.io"
BLOCK_EXPLORER_API_URL="https://block-explorer-api.mainnet.zksync.io"
```

Once the configuration is in place, the services can be started using:

``` shell
docker compose -f compose-proxy.yaml up
```

### Double Zero mode

This configuration is meant to target a private validium chain. The only
configuration needed is a rpc for the chain.

``` .env
# validium.env
TARGET_RPC="http://my-private-rpc:4444"
```

Once the configuration it's in place the services can be started like this:

``` shell
docker compose -f compose-00.yaml up 
```
