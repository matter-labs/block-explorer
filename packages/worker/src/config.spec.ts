import config from "./config";

describe("config", () => {
  const env = process.env;
  let defaultConfig;

  beforeAll(() => {
    process.env = {};

    defaultConfig = {
      port: 3001,
      blockchain: {
        rpcUrl: "http://localhost:3050",
        rpcCallDefaultRetryTimeout: 30000,
        rpcCallQuickRetryTimeout: 500,
        rpcCallConnectionTimeout: 20000,
        rpcCallConnectionQuickTimeout: 10000,
        rpcBatchMaxCount: 10,
        rpcBatchMaxSizeBytes: 1048576,
        rpcBatchStallTimeMs: 0,
      },
      dataFetcher: {
        url: "http://localhost:3040",
        requestTimeout: 150_000,
      },
      blocks: {
        waitForBlocksInterval: 1000,
        blocksProcessingBatchSize: 50,
        blocksProcessingWorkerPoolSize: 1,
        maxBlocksAheadOfLastReadyBlock: 1000,
        enqueuerPollingInterval: 1000,
        chainTipPollingInterval: 1000,
        fromBlock: 0,
        toBlock: null,
        disableBlocksRevert: false,
        disableBlockStatusProcessing: false,
        statusCheckPollingInterval: 60000,
      },
      balances: {
        deleteBalancesInterval: 300000,
        disableOldBalancesCleaner: false,
      },
      counters: {
        recordsBatchSize: 20000,
        updateInterval: 30000,
        disableCountersProcessing: false,
      },
      tokens: {
        enableTokenOffChainDataSaver: false,
        updateTokenOffChainDataInterval: 86_400_000,
        tokenOffChainDataProviders: ["coingecko", "portalsFi"],
        selectedTokenOffChainDataProvider: "coingecko",
        coingecko: {
          isProPlan: false,
          apiKey: undefined,
          platformId: "zksync",
        },
        baseToken: {
          symbol: "ETH",
          decimals: 18,
          l1Address: "0x0000000000000000000000000000000000000000",
          iconUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
          name: "Ether",
        },
      },
      metrics: {
        collectDbConnectionPoolMetricsInterval: 10000,
        collectBlocksToProcessMetricInterval: 10000,
        missingBlocks: {
          disabled: false,
          interval: 86_400_000,
        },
      },
      healthChecks: {
        rpcHealthCheckTimeoutMs: 20_000,
        dbHealthCheckTimeoutMs: 20_000,
      },
      prividium: {
        enabled: false,
        disableTxVisibilityByTopics: false,
      },
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("sets default values", () => {
    expect(config()).toEqual({
      port: 3001,
      blockchain: {
        rpcUrl: "http://localhost:3050",
        rpcCallDefaultRetryTimeout: 30000,
        rpcCallQuickRetryTimeout: 500,
        rpcCallConnectionTimeout: 20000,
        rpcCallConnectionQuickTimeout: 10000,
        rpcBatchMaxCount: 10,
        rpcBatchMaxSizeBytes: 1048576,
        rpcBatchStallTimeMs: 0,
      },
      dataFetcher: {
        url: "http://localhost:3040",
        requestTimeout: 150_000,
      },
      blocks: {
        waitForBlocksInterval: 1000,
        blocksProcessingBatchSize: 50,
        blocksProcessingWorkerPoolSize: 1,
        maxBlocksAheadOfLastReadyBlock: 1000,
        enqueuerPollingInterval: 1000,
        chainTipPollingInterval: 1000,
        fromBlock: 0,
        toBlock: null,
        disableBlocksRevert: false,
        disableBlockStatusProcessing: false,
        statusCheckPollingInterval: 60000,
      },
      balances: {
        deleteBalancesInterval: 300000,
        disableOldBalancesCleaner: false,
      },
      counters: {
        recordsBatchSize: 20000,
        updateInterval: 30000,
        disableCountersProcessing: false,
      },
      tokens: {
        enableTokenOffChainDataSaver: false,
        updateTokenOffChainDataInterval: 86_400_000,
        tokenOffChainDataProviders: ["coingecko", "portalsFi"],
        selectedTokenOffChainDataProvider: "coingecko",
        coingecko: {
          isProPlan: false,
          apiKey: undefined,
          platformId: "zksync",
        },
        baseToken: {
          symbol: "ETH",
          decimals: 18,
          l1Address: "0x0000000000000000000000000000000000000000",
          iconUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
          name: "Ether",
        },
      },
      metrics: {
        collectDbConnectionPoolMetricsInterval: 10000,
        collectBlocksToProcessMetricInterval: 10000,
        missingBlocks: {
          disabled: false,
          interval: 86_400_000,
        },
      },
      healthChecks: {
        rpcHealthCheckTimeoutMs: 20_000,
        dbHealthCheckTimeoutMs: 20_000,
      },
      prividium: {
        enabled: false,
        disableTxVisibilityByTopics: false,
      },
    });
  });

  describe("when RPC_BATCH_MAX_COUNT is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        RPC_BATCH_MAX_COUNT: "40",
      };
    });

    it("sets rpcBatchMaxCount to the value from env vars", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        blockchain: {
          ...defaultConfig.blockchain,
          rpcBatchMaxCount: 40,
        },
      });
    });
  });

  describe("when RPC_BATCH_MAX_SIZE_BYTES is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        RPC_BATCH_MAX_SIZE_BYTES: "50",
      };
    });

    it("sets rpcBatchMaxSizeBytes to the value from env vars", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        blockchain: {
          ...defaultConfig.blockchain,
          rpcBatchMaxSizeBytes: 50,
        },
      });
    });
  });

  describe("when RPC_BATCH_STALL_TIME_MS is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        RPC_BATCH_STALL_TIME_MS: "7",
      };
    });

    it("sets rpcBatchMaxSizeBytes to the value from env vars", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        blockchain: {
          ...defaultConfig.blockchain,
          rpcBatchStallTimeMs: 7,
        },
      });
    });
  });

  describe("when PRIVIDIUM is set to true", () => {
    beforeEach(() => {
      process.env = { PRIVIDIUM: "true" };
    });

    it("sets prividium.enabled to true", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        prividium: { enabled: true, disableTxVisibilityByTopics: false },
      });
    });
  });

  describe("when PRIVIDIUM_DISABLE_TX_VISIBILITY_BY_TOPICS is set to true", () => {
    beforeEach(() => {
      process.env = { PRIVIDIUM: "true", PRIVIDIUM_DISABLE_TX_VISIBILITY_BY_TOPICS: "true" };
    });

    it("sets prividium.disableTxVisibilityByTopics to true", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        prividium: { enabled: true, disableTxVisibilityByTopics: true },
      });
    });
  });
});
