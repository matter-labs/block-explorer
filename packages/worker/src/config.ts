export default () => {
  const {
    PORT,
    BLOCKCHAIN_RPC_URL,
    DATA_FETCHER_URL,
    DATA_FETCHER_REQUEST_TIMEOUT,
    RPC_CALLS_DEFAULT_RETRY_TIMEOUT,
    RPC_CALLS_QUICK_RETRY_TIMEOUT,
    RPC_CALLS_CONNECTION_TIMEOUT,
    RPC_CALLS_CONNECTION_QUICK_TIMEOUT,
    RPC_BATCH_MAX_SIZE_BYTES,
    RPC_BATCH_MAX_COUNT,
    RPC_BATCH_STALL_TIME_MS,
    WAIT_FOR_BLOCKS_INTERVAL,
    BLOCKS_PROCESSING_BATCH_SIZE,
    NUMBER_OF_BLOCKS_PER_DB_TRANSACTION,
    BATCHES_PROCESSING_POLLING_INTERVAL,
    DELETE_BALANCES_INTERVAL,
    COUNTERS_PROCESSING_POLLING_INTERVAL,
    COUNTERS_PROCESSING_RECORDS_BATCH_SIZE,
    COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL,
    COLLECT_BLOCKS_TO_PROCESS_METRIC_INTERVAL,
    DISABLE_BATCHES_PROCESSING,
    DISABLE_COUNTERS_PROCESSING,
    DISABLE_OLD_BALANCES_CLEANER,
    DISABLE_BLOCKS_REVERT,
    ENABLE_TOKEN_OFFCHAIN_DATA_SAVER,
    UPDATE_TOKEN_OFFCHAIN_DATA_INTERVAL,
    SELECTED_TOKEN_OFFCHAIN_DATA_PROVIDER,
    FROM_BLOCK,
    TO_BLOCK,
    COINGECKO_IS_PRO_PLAN,
    COINGECKO_API_KEY,
  } = process.env;

  return {
    port: parseInt(PORT, 10) || 3001,
    blockchain: {
      rpcUrl: BLOCKCHAIN_RPC_URL || "http://localhost:3050",
      rpcCallDefaultRetryTimeout: parseInt(RPC_CALLS_DEFAULT_RETRY_TIMEOUT, 10) || 30000,
      rpcCallQuickRetryTimeout: parseInt(RPC_CALLS_QUICK_RETRY_TIMEOUT, 10) || 500,
      rpcCallConnectionTimeout: parseInt(RPC_CALLS_CONNECTION_TIMEOUT, 10) || 20000,
      rpcCallConnectionQuickTimeout: parseInt(RPC_CALLS_CONNECTION_QUICK_TIMEOUT, 10) || 10000,
      // maximum number of requests to allow in a batch.
      // If rpcBatchMaxCount = 1, then batching is disabled.
      rpcBatchMaxCount: parseInt(RPC_BATCH_MAX_COUNT, 10) || 10,
      // target maximum size (bytes) to allow per batch request (default: 1Mb)
      // If rpcBatchMaxCount = 1, this is ignored.
      rpcBatchMaxSizeBytes: parseInt(RPC_BATCH_MAX_SIZE_BYTES, 10) || 1048576,
      // how long (ms) to aggregate requests into a single batch.
      // 0 indicates batching will only encompass the current event loop.
      // If rpcBatchMaxCount = 1, this is ignored.
      rpcBatchStallTimeMs: parseInt(RPC_BATCH_STALL_TIME_MS, 10) || 0,
    },
    dataFetcher: {
      url: DATA_FETCHER_URL || "http://localhost:3040",
      requestTimeout: parseInt(DATA_FETCHER_REQUEST_TIMEOUT, 10) || 150_000,
    },
    blocks: {
      waitForBlocksInterval: parseInt(WAIT_FOR_BLOCKS_INTERVAL, 10) || 1000,
      blocksProcessingBatchSize: parseInt(BLOCKS_PROCESSING_BATCH_SIZE, 10) || 50,
      fromBlock: parseInt(FROM_BLOCK, 10) || 0,
      toBlock: parseInt(TO_BLOCK, 10) || null,
      disableBlocksRevert: DISABLE_BLOCKS_REVERT === "true",
      numberOfBlocksPerDbTransaction: parseInt(NUMBER_OF_BLOCKS_PER_DB_TRANSACTION, 10) || 50,
    },
    batches: {
      batchesProcessingPollingInterval: parseInt(BATCHES_PROCESSING_POLLING_INTERVAL, 10) || 60000,
      disableBatchesProcessing: DISABLE_BATCHES_PROCESSING === "true",
    },
    balances: {
      deleteBalancesInterval: parseInt(DELETE_BALANCES_INTERVAL, 10) || 300000,
      disableOldBalancesCleaner: DISABLE_OLD_BALANCES_CLEANER === "true",
    },
    counters: {
      recordsBatchSize: parseInt(COUNTERS_PROCESSING_RECORDS_BATCH_SIZE, 10) || 20000,
      updateInterval: parseInt(COUNTERS_PROCESSING_POLLING_INTERVAL, 10) || 30000,
      disableCountersProcessing: DISABLE_COUNTERS_PROCESSING === "true",
    },
    tokens: {
      enableTokenOffChainDataSaver: ENABLE_TOKEN_OFFCHAIN_DATA_SAVER === "true",
      updateTokenOffChainDataInterval: parseInt(UPDATE_TOKEN_OFFCHAIN_DATA_INTERVAL, 10) || 86_400_000,
      tokenOffChainDataProviders: ["coingecko", "portalsFi"],
      selectedTokenOffChainDataProvider: SELECTED_TOKEN_OFFCHAIN_DATA_PROVIDER || "coingecko",
      coingecko: {
        isProPlan: COINGECKO_IS_PRO_PLAN === "true",
        apiKey: COINGECKO_API_KEY,
      },
    },
    metrics: {
      collectDbConnectionPoolMetricsInterval: parseInt(COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL, 10) || 10000,
      collectBlocksToProcessMetricInterval: parseInt(COLLECT_BLOCKS_TO_PROCESS_METRIC_INTERVAL, 10) || 10000,
    },
  };
};
