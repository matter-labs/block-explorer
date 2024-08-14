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
    WS_MAX_CONNECTIONS,
    USE_WEBSOCKETS_FOR_TRANSACTIONS,
    MAX_BLOCKS_BATCH_SIZE,
    GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  } = process.env;

  return {
    port: parseInt(PORT, 10) || 3040,
    blockchain: {
      rpcUrl: BLOCKCHAIN_RPC_URL || "http://localhost:3050",

      rpcCallDefaultRetryTimeout: parseInt(RPC_CALLS_DEFAULT_RETRY_TIMEOUT, 10) || 300000,
      rpcCallQuickRetryTimeout: parseInt(RPC_CALLS_QUICK_RETRY_TIMEOUT, 10) || 50000,
      rpcCallRetriesMaxTotalTimeout: parseInt(RPC_CALLS_RETRIES_MAX_TOTAL_TIMEOUT, 10) || 1200000,

      rpcCallConnectionTimeout: parseInt(RPC_CALLS_CONNECTION_TIMEOUT, 10) || 600000,
      rpcCallConnectionQuickTimeout: parseInt(RPC_CALLS_CONNECTION_QUICK_TIMEOUT, 10) || 100000,

      wsMaxConnections: parseInt(WS_MAX_CONNECTIONS, 10) || 10,
      useWebSocketsForTransactions: USE_WEBSOCKETS_FOR_TRANSACTIONS === "true",
    },
    maxBlocksBatchSize: parseInt(MAX_BLOCKS_BATCH_SIZE, 10) || 20,
    gracefulShutdownTimeoutMs: parseInt(GRACEFUL_SHUTDOWN_TIMEOUT_MS, 10) || 0,
  };
};
