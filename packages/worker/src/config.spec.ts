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
        rpcCallDefaultRetryTimeout: 30000,
        rpcCallQuickRetryTimeout: 500,
        rpcCallConnectionTimeout: 20000,
        rpcCallConnectionQuickTimeout: 10000,
      },
      blocks: {
        waitForBlocksInterval: 1000,
        blocksProcessingBatchSize: 50,
        fromBlock: 0,
        toBlock: null,
        disableBlocksRevert: false,
      },
      batches: {
        batchesProcessingPollingInterval: 60000,
        disableBatchesProcessing: false,
      },
      balances: {
        deleteBalancesInterval: 300000,
        disableBalancesProcessing: false,
        disableOldBalancesCleaner: false,
      },
      counters: {
        recordsBatchSize: 20000,
        updateInterval: 30000,
        disableCountersProcessing: false,
      },
      metrics: {
        collectDbConnectionPoolMetricsInterval: 10000,
        collectBlocksToProcessMetricInterval: 10000,
      },
    });
  });
});
