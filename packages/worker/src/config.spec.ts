import config from "./config";

describe("config", () => {
  const env = process.env;

  beforeAll(() => {
    process.env = {};
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
      },
      dataFetcher: {
        url: "http://localhost:3040",
        requestTimeout: 120_000,
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
});
