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
docker compose -f docker-compose.yaml up
```

Navigating to [http://localhost:3010](http://localhost:3010) will show the explorer.

Permissions can be configured editing [this](./local-permissions.yaml) file. 

 
### Proxy mode

This configuration leverages existing block explorer infrastructure instead of running all indexing components locally.
It connects to an established explorer API URL provided via configuration.

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

Permissions can be configured editing [this](./proxy-permissions.yaml) file.

### Double Zero mode

This configuration is meant to target a private validium chain. The only
configuration needed is a rpc for the chain.

``` .env
# validium.env
TARGET_RPC="http://my-private-rpc:4444"
```

Permissions can be configured editing [this](./validium-permissions.yaml) file.

In case that you are running a local validium chain, the easiest way to
connect the docker containers with the chain running in the host machine
is by providing the local ip of the host machine. In linux you can do this
by running

``` shell
ifconfig wlan0 | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}'
```

Or in mac:

``` shell
ipconfig getifaddr en0
```

Then, the ip can be combined with the port of the local rpc. The final
address is something like `http://{my-ip}:{port}`.

Once the configuration is in place the services can be started like this:

``` shell
docker compose -f compose-00.yaml up 
```


## Spawning a local validium chain

This can be done using zkstack: https://docs.zksync.io/zk-stack/running-a-zk-chain/quickstart
