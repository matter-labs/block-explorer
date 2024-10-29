import { config } from "dotenv";
config();

export default () => {
  const {
    PORT,
    BLOCKCHAIN_RPC_URL,
    RPC_CALLS_DEFAULT_RETRY_TIMEOUT,
    RPC_CALLS_QUICK_RETRY_TIMEOUT,
    RPC_CALLS_RETRIES_MAX_TOTAL_TIMEOUT,
    RPC_CALLS_CONNECTION_TIMEOUT,
    RPC_CALLS_CONNECTION_QUICK_TIMEOUT,
    RPC_BATCH_MAX_SIZE_BYTES,
    RPC_BATCH_MAX_COUNT,
    RPC_BATCH_STALL_TIME_MS,
    MAX_BLOCKS_BATCH_SIZE,
    GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  } = process.env;

  return {
    port: parseInt(PORT, 10) || 3040,
    blockchain: {
      rpcUrl: BLOCKCHAIN_RPC_URL || "http://localhost:3050",

      rpcCallDefaultRetryTimeout: parseInt(RPC_CALLS_DEFAULT_RETRY_TIMEOUT, 10) || 30000,
      rpcCallQuickRetryTimeout: parseInt(RPC_CALLS_QUICK_RETRY_TIMEOUT, 10) || 5000,
      rpcCallRetriesMaxTotalTimeout: parseInt(RPC_CALLS_RETRIES_MAX_TOTAL_TIMEOUT, 10) || 120000,

      rpcCallConnectionTimeout: parseInt(RPC_CALLS_CONNECTION_TIMEOUT, 10) || 60000,
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
    maxBlocksBatchSize: parseInt(MAX_BLOCKS_BATCH_SIZE, 10) || 20,
    gracefulShutdownTimeoutMs: parseInt(GRACEFUL_SHUTDOWN_TIMEOUT_MS, 10) || 0,
  };
};
