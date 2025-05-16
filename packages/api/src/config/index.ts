import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as featureFlags from "./featureFlags";
import { BASE_TOKEN_L1_ADDRESS, BASE_TOKEN_L2_ADDRESS } from "../common/constants";
import { z } from "zod";
import { prividium } from "./featureFlags";

export type BaseToken = {
  name: string;
  symbol: string;
  decimals: number;
  l1Address: string;
  l2Address: string;
  liquidity?: number;
  iconURL?: string;
  usdPrice?: number;
};

const defaultBaseToken: BaseToken = {
  l2Address: BASE_TOKEN_L2_ADDRESS,
  l1Address: BASE_TOKEN_L1_ADDRESS,
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  // Fallback data in case ETH token is not in the DB
  iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
};

const getBaseToken = (): BaseToken => {
  const {
    BASE_TOKEN_SYMBOL,
    BASE_TOKEN_DECIMALS,
    BASE_TOKEN_L1_ADDRESS,
    BASE_TOKEN_ICON_URL,
    BASE_TOKEN_NAME,
    BASE_TOKEN_LIQUIDITY,
    BASE_TOKEN_USDPRICE,
  } = process.env;

  if (BASE_TOKEN_L1_ADDRESS && BASE_TOKEN_SYMBOL) {
    return {
      name: BASE_TOKEN_NAME,
      symbol: BASE_TOKEN_SYMBOL,
      decimals: parseInt(BASE_TOKEN_DECIMALS, 10),
      l1Address: BASE_TOKEN_L1_ADDRESS,
      l2Address: BASE_TOKEN_L2_ADDRESS,
      liquidity: parseFloat(BASE_TOKEN_LIQUIDITY) || undefined,
      iconURL: BASE_TOKEN_ICON_URL,
      usdPrice: parseFloat(BASE_TOKEN_USDPRICE) || undefined,
    };
  }

  return defaultBaseToken;
};

const getEthToken = (): BaseToken => {
  const {
    ETH_TOKEN_SYMBOL,
    ETH_TOKEN_DECIMALS,
    ETH_TOKEN_L2_ADDRESS,
    ETH_TOKEN_ICON_URL,
    ETH_TOKEN_NAME,
    ETH_TOKEN_LIQUIDITY,
    ETH_TOKEN_USDPRICE,
  } = process.env;

  if (ETH_TOKEN_L2_ADDRESS) {
    return {
      name: ETH_TOKEN_NAME || defaultBaseToken.name,
      symbol: ETH_TOKEN_SYMBOL || defaultBaseToken.symbol,
      decimals: parseFloat(ETH_TOKEN_DECIMALS) || defaultBaseToken.decimals,
      l1Address: "0x0000000000000000000000000000000000000000",
      l2Address: ETH_TOKEN_L2_ADDRESS,
      liquidity: parseFloat(ETH_TOKEN_LIQUIDITY) || undefined,
      iconURL: ETH_TOKEN_ICON_URL || defaultBaseToken.iconURL,
      usdPrice: parseFloat(ETH_TOKEN_USDPRICE) || undefined,
    };
  }

  return defaultBaseToken;
};

export const baseToken: BaseToken = getBaseToken();
export const ethToken: BaseToken = getEthToken();

export default () => {
  const {
    NODE_ENV,
    PORT,
    METRICS_PORT,
    COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL,
    DATABASE_URL,
    DATABASE_CONNECTION_POOL_SIZE,
    DATABASE_CONNECTION_IDLE_TIMEOUT_MS,
    DATABASE_STATEMENT_TIMEOUT_MS,
    CONTRACT_VERIFICATION_API_URL,
    GRACEFUL_SHUTDOWN_TIMEOUT_MS,
    APP_HOSTNAME,
    PRIVIDIUM_PRIVATE_RPC_URL,
    PRIVIDIUM_PRIVATE_RPC_SECRET,
  } = process.env;

  const MAX_NUMBER_OF_REPLICA = 100;

  const getDatabaseReplicaSet = () => {
    const replicaSet = [];
    for (let i = 0; i < MAX_NUMBER_OF_REPLICA; i++) {
      const replicaURL = process.env[`DATABASE_REPLICA_URL_${i}`];
      if (!replicaURL) {
        break;
      }
      replicaSet.push({
        url: replicaURL,
      });
    }
    return replicaSet;
  };

  const getTypeOrmModuleOptions = (): TypeOrmModuleOptions => {
    const master = { url: DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/block-explorer" };
    const replicaSet = getDatabaseReplicaSet();

    return {
      type: "postgres",
      ...(!replicaSet.length && {
        ...master,
      }),
      ...(replicaSet.length && {
        replication: {
          // Use first replica as master as for now API doesn't perform write queries.
          // If master or any replica is down the app won't start.
          // Traffic is randomly distributed across replica set for read queries.
          // There is no replica failure tolerance by typeOrm, it keeps sending traffic to a replica even if it is down.
          // Health check verifies master only, there is no way to get a connection for a specific replica from typeOrm.
          master: replicaSet[0],
          slaves: replicaSet,
        },
      }),
      poolSize: parseInt(DATABASE_CONNECTION_POOL_SIZE, 10) || 300,
      extra: {
        idleTimeoutMillis: parseInt(DATABASE_CONNECTION_IDLE_TIMEOUT_MS, 10) || 60000,
        statement_timeout: parseInt(DATABASE_STATEMENT_TIMEOUT_MS, 10) || 90_000,
      },
      synchronize: NODE_ENV === "test",
      logging: false,
      autoLoadEntities: true,
      retryAttempts: 10,
      retryDelay: 3000,
      applicationName: "block-explorer-api",
    };
  };

  const getPrividiumConfig = () => {
    return {
      privateRpcUrl: PRIVIDIUM_PRIVATE_RPC_URL,
      privateRpcSecret: PRIVIDIUM_PRIVATE_RPC_SECRET,
    };
  };

  return {
    NODE_ENV,
    port: parseInt(PORT, 10) || 3020,
    metrics: {
      port: parseInt(METRICS_PORT, 10) || 3005,
      collectDbConnectionPoolMetricsInterval: parseInt(COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL, 10) || 10000,
    },
    typeORM: getTypeOrmModuleOptions(),
    contractVerificationApiUrl: CONTRACT_VERIFICATION_API_URL || "http://127.0.0.1:3070",
    featureFlags,
    baseToken: getBaseToken(),
    ethToken: getEthToken(),
    gracefulShutdownTimeoutMs: parseInt(GRACEFUL_SHUTDOWN_TIMEOUT_MS, 10) || 0,
    appHostname: APP_HOSTNAME,
    prividium: getPrividiumConfig(),
  };
};
