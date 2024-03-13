import config from "../config";
jest.mock("./featureFlags", () => ({
  feature1Enabled: true,
  feature2Enabled: false,
}));

describe("config", () => {
  const env = process.env;

  beforeAll(() => {
    process.env = {
      NODE_ENV: "test",
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("sets default values", () => {
    expect(config()).toEqual({
      baseTokenData: {
        l2Address: "0x000000000000000000000000000000000000800a",
        l1Address: "0x0000000000000000000000000000000000000001",
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        // Fallback data in case ETH token is not in the DB
        iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
        liquidity: 220000000000,
        usdPrice: 1800,
      },
      NODE_ENV: "test",
      port: 3020,
      metrics: {
        port: 3005,
        collectDbConnectionPoolMetricsInterval: 10000,
      },
      typeORM: {
        type: "postgres",
        url: "postgres://postgres:postgres@127.0.0.1:5432/block-explorer",
        poolSize: 300,
        extra: {
          idleTimeoutMillis: 60000,
          statement_timeout: 90000,
        },
        synchronize: true,
        logging: false,
        autoLoadEntities: true,
        retryAttempts: 10,
        retryDelay: 3000,
        applicationName: "block-explorer-api",
      },
      contractVerificationApiUrl: "http://127.0.0.1:3070",
      featureFlags: {
        feature1Enabled: true,
        feature2Enabled: false,
      },
    });
  });

  it("sets replication DB config if replica set exists", () => {
    process.env.DATABASE_REPLICA_URL_0 = "DATABASE_REPLICA_URL_0";
    process.env.DATABASE_REPLICA_URL_1 = "DATABASE_REPLICA_URL_1";

    expect(config()).toMatchObject({
      typeORM: {
        replication: {
          master: {
            url: "DATABASE_REPLICA_URL_0",
          },
          slaves: [
            {
              url: "DATABASE_REPLICA_URL_0",
            },
            {
              url: "DATABASE_REPLICA_URL_1",
            },
          ],
        },
      },
    });
  });
});