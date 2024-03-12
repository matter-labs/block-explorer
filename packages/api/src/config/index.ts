import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as featureFlags from "./featureFlags";
import { BASE_TOKEN_L2_ADDRESS } from "../common/constants";
type BaseToken = {
  symbol: string;
  decimals: number;
  l1Address: string;
  l2Address: string;
  liquidity: number;
  iconURL: string;
  name: string;
  usdPrice: number;
};
const defaultEthBaseToken: BaseToken = {
  l2Address: BASE_TOKEN_L2_ADDRESS,
  l1Address: "0x0000000000000000000000000000000000000000",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  // Fallback data in case ETH token is not in the DB
  iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
  liquidity: 220000000000,
  usdPrice: 1800,
};
const baseTokenFromEnv = (): BaseToken => {
  const {
    BASE_TOKEN_SYMBOL,
    BASE_TOKEN_DECIMALS,
    BASE_TOKEN_L1_ADDRESS,
    BASE_TOKEN_ICON_URL,
    BASE_TOKEN_NAME,
    BASE_TOKEN_LIQUIDITY,
    BASE_TOKEN_USDPRICE,
  } = process.env;
  const decimals = parseInt(BASE_TOKEN_DECIMALS);
  const liquidity = parseInt(BASE_TOKEN_LIQUIDITY);
  const usdPrice = parseInt(BASE_TOKEN_USDPRICE);
  if (BASE_TOKEN_L1_ADDRESS && BASE_TOKEN_SYMBOL) {
    return {
      symbol: BASE_TOKEN_SYMBOL,
      decimals,
      l1Address: BASE_TOKEN_L1_ADDRESS,
      l2Address: BASE_TOKEN_L2_ADDRESS,
      liquidity,
      iconURL: BASE_TOKEN_ICON_URL,
      usdPrice,
      name: BASE_TOKEN_NAME,
    };
  } else {
    return defaultEthBaseToken;
  }
};

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
  } = process.env;

  const baseTokenData: BaseToken = baseTokenFromEnv();

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
    baseTokenData,
  };
};
