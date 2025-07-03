import config from "../config";

jest.mock("./featureFlags", () => ({
  feature1Enabled: true,
  feature2Enabled: false,
}));

describe("config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      NODE_ENV: "test",
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("sets default values", () => {
    expect(config()).toEqual({
      baseToken: {
        l2Address: "0x000000000000000000000000000000000000800A",
        l1Address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        // Fallback data incase ETH token is not in the DB
        iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
      },
      ethToken: {
        decimals: 18,
        iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
        l1Address: "0x0000000000000000000000000000000000000000",
        l2Address: "0x000000000000000000000000000000000000800A",
        name: "Ether",
        symbol: "ETH",
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
      featureFlags: expect.objectContaining({
        feature1Enabled: true,
        feature2Enabled: false,
      }),
      gracefulShutdownTimeoutMs: 0,
      prividium: {},
    });
  });

  it("sets prividium values", async () => {
    process.env.PRIVIDIUM_PRIVATE_RPC_URL = "http://localhost:4000";
    process.env.PRIVIDIUM_PRIVATE_RPC_SECRET = "secret";
    process.env.PRIVIDIUM_CHAIN_ID = "300";
    process.env.PRIVIDIUM_SESSION_MAX_AGE = "1000";
    process.env.PRIVIDIUM_APP_URL = "http://localhost:3020";
    process.env.PRIVIDIUM_SIWE_EXPIRATION_TIME = "1000";
    process.env.PRIVIDIUM_SESSION_SECRET = "secret";

    jest.resetModules();
    jest.doMock("./featureFlags", () => ({
      feature1Enabled: true,
      feature2Enabled: false,
      prividium: true,
    }));

    const { default: currentConfig } = await import("../config");

    expect(currentConfig()).toEqual({
      baseToken: {
        l2Address: "0x000000000000000000000000000000000000800A",
        l1Address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        // Fallback data incase ETH token is not in the DB
        iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
      },
      ethToken: {
        decimals: 18,
        iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
        l1Address: "0x0000000000000000000000000000000000000000",
        l2Address: "0x000000000000000000000000000000000000800A",
        name: "Ether",
        symbol: "ETH",
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
      featureFlags: expect.objectContaining({
        feature1Enabled: true,
        feature2Enabled: false,
        prividium: true,
      }),
      gracefulShutdownTimeoutMs: 0,
      prividium: {
        privateRpcUrl: "http://localhost:4000",
        privateRpcSecret: "secret",
        chainId: 300,
        sessionMaxAge: 1000,
        appUrl: "http://localhost:3020",
        siweExpirationTime: 1000,
        sessionSecret: "secret",
      },
    });
  });

  describe("prividium validations", () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock("./featureFlags", () => ({
        feature1Enabled: true,
        feature2Enabled: false,
        prividium: true,
      }));

      process.env.PRIVIDIUM_PRIVATE_RPC_URL = "http://localhost:4000";
      process.env.PRIVIDIUM_PRIVATE_RPC_SECRET = "secret";
      process.env.PRIVIDIUM_CHAIN_ID = "300";
      process.env.PRIVIDIUM_SESSION_MAX_AGE = "1000";
      process.env.PRIVIDIUM_APP_URL = "http://localhost:3020";
      process.env.PRIVIDIUM_SIWE_EXPIRATION_TIME = "1000";
      process.env.PRIVIDIUM_SESSION_SECRET = "secret";
    });

    it("throws error when prividium is true and PRIVIDIUM_APP_URL is missing", async () => {
      process.env.PRIVIDIUM_APP_URL = undefined;
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_APP_URL has to be a valid url")
      );
    });

    it("throws error when prividium is true and PRIVIDIUM_APP_URL is not a valid url", async () => {
      process.env.PRIVIDIUM_APP_URL = "thisisnotavalidurl";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_APP_URL has to be a valid url")
      );
    });

    it("throws error when prividium is true and PRIVIDIUM_PRIVATE_RPC_SECRET is not present", async () => {
      process.env.PRIVIDIUM_PRIVATE_RPC_SECRET = undefined;
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_PRIVATE_RPC_SECRET has to be a non empty string")
      );
    });

    it("throws error when prividium is true and PRIVIDIUM_PRIVATE_RPC_SECRET is an empty string", async () => {
      process.env.PRIVIDIUM_PRIVATE_RPC_SECRET = "";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_PRIVATE_RPC_SECRET has to be a non empty string")
      );
    });

    it("throws error when prividium is true and PRIVIDIUM_CHAIN_ID is not present", async () => {
      process.env.PRIVIDIUM_CHAIN_ID = undefined;
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_CHAIN_ID has to be a positive integer")
      );
    });

    it("throws error when prividium is true and PRIVIDIUM_CHAIN_ID is negative", async () => {
      process.env.PRIVIDIUM_CHAIN_ID = "-10";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_CHAIN_ID has to be a positive integer")
      );
    });

    it("throws error when prividium is true and PRIVIDIUM_CHAIN_ID is float", async () => {
      process.env.PRIVIDIUM_CHAIN_ID = "1.10";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_CHAIN_ID has to be a positive integer")
      );
    });

    it("throws error hen prividium is true and PRIVIDIUM_SESSION_MAX_AGE is absent", async () => {
      process.env.PRIVIDIUM_SESSION_MAX_AGE = undefined;
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_SESSION_MAX_AGE has to be a positive integer")
      );
    });

    it("throws error hen prividium is true and PRIVIDIUM_SESSION_MAX_AGE negative", async () => {
      process.env.PRIVIDIUM_SESSION_MAX_AGE = "-10";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_SESSION_MAX_AGE has to be a positive integer")
      );
    });

    it("throws error hen prividium is true and PRIVIDIUM_SESSION_MAX_AGE is non integer", async () => {
      process.env.PRIVIDIUM_SESSION_MAX_AGE = "1.10";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_SESSION_MAX_AGE has to be a positive integer")
      );
    });

    it("throws error hen prividium is true and PRIVIDIUM_SESSION_MAX_AGE is non integer", async () => {
      process.env.PRIVIDIUM_SESSION_MAX_AGE = "1.10";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_SESSION_MAX_AGE has to be a positive integer")
      );
    });

    it("throws error hen prividium is true and PRIVIDIUM_SESSION_SECRET is absent", async () => {
      process.env.PRIVIDIUM_SESSION_SECRET = undefined;
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_SESSION_SECRET has to be a non empty string")
      );
    });

    it("throws error hen prividium is true and PRIVATE_RPC_URL is absent", async () => {
      process.env.PRIVIDIUM_PRIVATE_RPC_URL = undefined;
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_PRIVATE_RPC_URL has to be valid url")
      );
    });

    it("throws error hen prividium is true and PRIVATE_RPC_URL is not a valid url", async () => {
      process.env.PRIVIDIUM_PRIVATE_RPC_URL = "this is not a valid url";
      const { default: currentConfig } = await import("../config");
      expect(() => currentConfig()).toThrow(
        new Error("Invalid prividium config: PRIVIDIUM_PRIVATE_RPC_URL has to be valid url")
      );
    });
  });

  describe("when custom base token is defined", () => {
    it("sets default values with base ERC20", () => {
      process.env = {
        BASE_TOKEN_SYMBOL: "MTTL",
        BASE_TOKEN_DECIMALS: "18",
        BASE_TOKEN_L1_ADDRESS: "0xSomeAddress",
        BASE_TOKEN_ICON_URL: "https://matter-labs.io",
        BASE_TOKEN_NAME: "MatterLabs",
        BASE_TOKEN_LIQUIDITY: "999999999999",
        BASE_TOKEN_USDPRICE: "19",
        NODE_ENV: "test",

        ETH_TOKEN_SYMBOL: "ETH1",
        ETH_TOKEN_DECIMALS: "181",
        ETH_TOKEN_L2_ADDRESS: "0x000000000000000000000000000000000000800A1",
        ETH_TOKEN_ICON_URL: "iconUrl",
        ETH_TOKEN_NAME: "Ether1",
        ETH_TOKEN_LIQUIDITY: "2200000000001",
        ETH_TOKEN_USDPRICE: "18001",
      };

      expect(config()).toEqual({
        baseToken: {
          l2Address: "0x000000000000000000000000000000000000800A",
          l1Address: "0xSomeAddress",
          symbol: "MTTL",
          name: "MatterLabs",
          decimals: 18,
          iconURL: "https://matter-labs.io",
          liquidity: 999999999999,
          usdPrice: 19,
        },
        ethToken: {
          l2Address: "0x000000000000000000000000000000000000800A1",
          l1Address: "0x0000000000000000000000000000000000000000",
          symbol: "ETH1",
          name: "Ether1",
          decimals: 181,
          iconURL: "iconUrl",
          liquidity: 2200000000001,
          usdPrice: 18001,
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
        featureFlags: expect.objectContaining({
          feature1Enabled: true,
          feature2Enabled: false,
        }),
        gracefulShutdownTimeoutMs: 0,
        prividium: {},
      });
    });

    describe("and liquidity and price is not provided", () => {
      it("sets default values with base ERC20", () => {
        process.env = {
          BASE_TOKEN_SYMBOL: "MTTL",
          BASE_TOKEN_DECIMALS: "18",
          BASE_TOKEN_L1_ADDRESS: "0xSomeAddress",
          BASE_TOKEN_ICON_URL: "https://matter-labs.io",
          BASE_TOKEN_NAME: "MatterLabs",
          NODE_ENV: "test",

          ETH_TOKEN_SYMBOL: "ETH1",
          ETH_TOKEN_DECIMALS: "181",
          ETH_TOKEN_L2_ADDRESS: "0x000000000000000000000000000000000000800A1",
          ETH_TOKEN_ICON_URL: "iconUrl",
          ETH_TOKEN_NAME: "Ether1",
        };

        expect(config()).toEqual({
          baseToken: {
            l2Address: "0x000000000000000000000000000000000000800A",
            l1Address: "0xSomeAddress",
            symbol: "MTTL",
            name: "MatterLabs",
            decimals: 18,
            iconURL: "https://matter-labs.io",
          },
          ethToken: {
            l2Address: "0x000000000000000000000000000000000000800A1",
            l1Address: "0x0000000000000000000000000000000000000000",
            symbol: "ETH1",
            name: "Ether1",
            decimals: 181,
            iconURL: "iconUrl",
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
          featureFlags: expect.objectContaining({
            feature1Enabled: true,
            feature2Enabled: false,
          }),
          gracefulShutdownTimeoutMs: 0,
          prividium: {},
        });
      });
    });

    describe("and only l2 eth address is provided", () => {
      it("sets other l2 eth fields from the default configuration", () => {
        process.env = {
          BASE_TOKEN_SYMBOL: "MTTL",
          BASE_TOKEN_DECIMALS: "18",
          BASE_TOKEN_L1_ADDRESS: "0xSomeAddress",
          BASE_TOKEN_ICON_URL: "https://matter-labs.io",
          BASE_TOKEN_NAME: "MatterLabs",
          NODE_ENV: "test",

          ETH_TOKEN_L2_ADDRESS: "0x000000000000000000000000000000000000800A1",
        };

        expect(config()).toEqual({
          baseToken: {
            l2Address: "0x000000000000000000000000000000000000800A",
            l1Address: "0xSomeAddress",
            symbol: "MTTL",
            name: "MatterLabs",
            decimals: 18,
            iconURL: "https://matter-labs.io",
          },
          ethToken: {
            l2Address: "0x000000000000000000000000000000000000800A1",
            l1Address: "0x0000000000000000000000000000000000000000",
            liquidity: undefined,
            name: "Ether",
            symbol: "ETH",
            usdPrice: undefined,
            decimals: 18,
            iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
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
          featureFlags: expect.objectContaining({
            feature1Enabled: true,
            feature2Enabled: false,
          }),
          gracefulShutdownTimeoutMs: 0,
          prividium: {},
        });
      });
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
