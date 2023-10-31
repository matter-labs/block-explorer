export default () => {
  const {
    PORT,
    BLOCKCHAIN_RPC_URL,
    RPC_CALLS_DEFAULT_RETRY_TIMEOUT,
    RPC_CALLS_QUICK_RETRY_TIMEOUT,
    RPC_CALLS_CONNECTION_TIMEOUT,
    RPC_CALLS_CONNECTION_QUICK_TIMEOUT,
    WAIT_FOR_BLOCKS_INTERVAL,
    BLOCKS_PROCESSING_BATCH_SIZE,
    BATCHES_PROCESSING_POLLING_INTERVAL,
    DELETE_BALANCES_INTERVAL,
    COUNTERS_PROCESSING_POLLING_INTERVAL,
    COUNTERS_PROCESSING_RECORDS_BATCH_SIZE,
    COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL,
    COLLECT_BLOCKS_TO_PROCESS_METRIC_INTERVAL,
    DISABLE_BATCHES_PROCESSING,
    DISABLE_COUNTERS_PROCESSING,
    DISABLE_BALANCES_PROCESSING,
    DISABLE_OLD_BALANCES_CLEANER,
    DISABLE_BLOCKS_REVERT,
    ENABLE_TOKEN_INFO_WORKER,
    UPDATE_TOKEN_INFO_INTERVAL,
    TOKEN_INFO_MIN_LIQUIDITY_FILTER,
    FROM_BLOCK,
    TO_BLOCK,
  } = process.env;

  return {
    port: parseInt(PORT, 10) || 3001,
    blockchain: {
      rpcUrl: BLOCKCHAIN_RPC_URL || "http://localhost:3050",
      rpcCallDefaultRetryTimeout: parseInt(RPC_CALLS_DEFAULT_RETRY_TIMEOUT, 10) || 30000,
      rpcCallQuickRetryTimeout: parseInt(RPC_CALLS_QUICK_RETRY_TIMEOUT, 10) || 500,
      rpcCallConnectionTimeout: parseInt(RPC_CALLS_CONNECTION_TIMEOUT, 10) || 20000,
      rpcCallConnectionQuickTimeout: parseInt(RPC_CALLS_CONNECTION_QUICK_TIMEOUT, 10) || 10000,
    },
    blocks: {
      waitForBlocksInterval: parseInt(WAIT_FOR_BLOCKS_INTERVAL, 10) || 1000,
      blocksProcessingBatchSize: parseInt(BLOCKS_PROCESSING_BATCH_SIZE, 10) || 50,
      fromBlock: parseInt(FROM_BLOCK, 10) || 0,
      toBlock: parseInt(TO_BLOCK, 10) || null,
      disableBlocksRevert: DISABLE_BLOCKS_REVERT === "true",
    },
    batches: {
      batchesProcessingPollingInterval: parseInt(BATCHES_PROCESSING_POLLING_INTERVAL, 10) || 60000,
      disableBatchesProcessing: DISABLE_BATCHES_PROCESSING === "true",
    },
    balances: {
      deleteBalancesInterval: parseInt(DELETE_BALANCES_INTERVAL, 10) || 300000,
      disableBalancesProcessing: DISABLE_BALANCES_PROCESSING === "true",
      disableOldBalancesCleaner: DISABLE_OLD_BALANCES_CLEANER === "true",
    },
    counters: {
      recordsBatchSize: parseInt(COUNTERS_PROCESSING_RECORDS_BATCH_SIZE, 10) || 20000,
      updateInterval: parseInt(COUNTERS_PROCESSING_POLLING_INTERVAL, 10) || 30000,
      disableCountersProcessing: DISABLE_COUNTERS_PROCESSING === "true",
    },
    tokens: {
      enableTokenInfoWorker: ENABLE_TOKEN_INFO_WORKER === "true",
      updateTokenInfoInterval: parseInt(UPDATE_TOKEN_INFO_INTERVAL, 10) || 86_400_000,
      minTokensLiquidityFilter: parseInt(TOKEN_INFO_MIN_LIQUIDITY_FILTER, 10) || 1000_000,
    },
    metrics: {
      collectDbConnectionPoolMetricsInterval: parseInt(COLLECT_DB_CONNECTION_POOL_METRICS_INTERVAL, 10) || 10000,
      collectBlocksToProcessMetricInterval: parseInt(COLLECT_BLOCKS_TO_PROCESS_METRIC_INTERVAL, 10) || 10000,
    },
  };
};
