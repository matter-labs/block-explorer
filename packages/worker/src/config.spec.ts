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
        fromBlock: 0,
        toBlock: null,
        disableBlocksRevert: false,
        numberOfBlocksPerDbTransaction: 50,
      },
      batches: {
        batchesProcessingPollingInterval: 60000,
        disableBatchesProcessing: false,
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
        },
      },
      metrics: {
        collectDbConnectionPoolMetricsInterval: 10000,
        collectBlocksToProcessMetricInterval: 10000,
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
        fromBlock: 0,
        toBlock: null,
        disableBlocksRevert: false,
        numberOfBlocksPerDbTransaction: 50,
      },
      batches: {
        batchesProcessingPollingInterval: 60000,
        disableBatchesProcessing: false,
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
        },
      },
      metrics: {
        collectDbConnectionPoolMetricsInterval: 10000,
        collectBlocksToProcessMetricInterval: 10000,
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
});
