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

      rpcBatchMaxSizeBytes: parseInt(RPC_BATCH_MAX_SIZE_BYTES, 10) || 1048576, // 1Mb is the default setting in ethers
      rpcBatchMaxCount: parseInt(RPC_BATCH_MAX_COUNT, 10) || 10, // 10 by default unlike 100 that is default in ethers
    },
    maxBlocksBatchSize: parseInt(MAX_BLOCKS_BATCH_SIZE, 10) || 20,
    gracefulShutdownTimeoutMs: parseInt(GRACEFUL_SHUTDOWN_TIMEOUT_MS, 10) || 0,
  };
};
