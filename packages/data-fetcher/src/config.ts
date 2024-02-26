import { config } from "dotenv";
config();
export type NetworkKey = string;
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
    BRIDGE_NETWORK_KEYS,
  } = process.env;

  const networkKeys = BRIDGE_NETWORK_KEYS.split(",");
  const key2L1 = Object.fromEntries(
    networkKeys.map((key) => {
      return [key, process.env[`L1_ERC20_BRIDGE_${key.toUpperCase()}`]];
    })
  );
  const key2L2 = Object.fromEntries(
    networkKeys.map((key) => {
      return [key, process.env[`L2_ERC20_BRIDGE_${key.toUpperCase()}`]];
    })
  );
  const L12Key = Object.fromEntries(
    networkKeys.map((key) => {
      return [(process.env[`L1_ERC20_BRIDGE_${key.toUpperCase()}`] || "").toLowerCase(), key];
    })
  );
  const L22Key = Object.fromEntries(
    networkKeys.map((key) => {
      return [(process.env[`L2_ERC20_BRIDGE_${key.toUpperCase()}`] || "").toLowerCase(), key];
    })
  );

  return {
    port: parseInt(PORT, 10) || 3040,
    blockchain: {
      rpcUrl: BLOCKCHAIN_RPC_URL || "http://localhost:3050",

      rpcCallDefaultRetryTimeout: parseInt(RPC_CALLS_DEFAULT_RETRY_TIMEOUT, 10) || 30000,
      rpcCallQuickRetryTimeout: parseInt(RPC_CALLS_QUICK_RETRY_TIMEOUT, 10) || 500,
      rpcCallRetriesMaxTotalTimeout: parseInt(RPC_CALLS_RETRIES_MAX_TOTAL_TIMEOUT, 10) || 90000,

      rpcCallConnectionTimeout: parseInt(RPC_CALLS_CONNECTION_TIMEOUT, 10) || 20000,
      rpcCallConnectionQuickTimeout: parseInt(RPC_CALLS_CONNECTION_QUICK_TIMEOUT, 10) || 10000,

      wsMaxConnections: parseInt(WS_MAX_CONNECTIONS, 10) || 5,
      useWebSocketsForTransactions: USE_WEBSOCKETS_FOR_TRANSACTIONS === "true",
    },
    maxBlocksBatchSize: parseInt(MAX_BLOCKS_BATCH_SIZE, 10) || 20,
    bridge: {
      networkKeys,
      getL1Erc20Bridge: (networkKey: NetworkKey): string | undefined => key2L1[networkKey],
      getL2Erc20Bridge: (networkKey: NetworkKey): string | undefined => key2L2[networkKey],
      getNetworkKeyByL1Erc20Bridge: (bridgeAddress: string): NetworkKey | undefined =>
        L12Key[bridgeAddress.toLowerCase()],
      getNetworkKeyByL2Erc20Bridge: (bridgeAddress: string): NetworkKey | undefined =>
        L22Key[bridgeAddress.toLowerCase()],
    },
  };
};
