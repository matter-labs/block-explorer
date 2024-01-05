import { Provider } from "@nestjs/common";
import { makeHistogramProvider, makeGaugeProvider } from "@willsoto/nestjs-prometheus";

export const BLOCKS_BATCH_PROCESSING_DURATION_METRIC_NAME = "blocks_batch_processing_duration_seconds";
export type BlocksBatchProcessingMetricLabels = "status";

export const BLOCK_PROCESSING_DURATION_METRIC_NAME = "block_processing_duration_seconds";
export type BlockProcessingMetricLabels = "status" | "action";

export const TRANSACTION_PROCESSING_DURATION_METRIC_NAME = "transaction_processing_duration_seconds";
export type ProcessingActionMetricLabel = "action";

export const DELETE_OLD_BALANCES_DURATION_METRIC_NAME = "delete_old_balances_duration_seconds";
export const DELETE_ZERO_BALANCES_DURATION_METRIC_NAME = "delete_zero_balances_duration_seconds";

export const GET_BLOCK_INFO_DURATION_METRIC_NAME = "get_block_info_duration_seconds";
export const GET_TRANSACTION_INFO_DURATION_METRIC_NAME = "get_transaction_info_duration_seconds";
export const GET_TOKEN_INFO_DURATION_METRIC_NAME = "get_token_info_duration_seconds";
export const DB_COMMIT_DURATION_METRIC_NAME = "db_commit_duration_seconds";

export const BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME = "blockchain_rpc_call_duration_seconds";
export type BlockchainRpcCallMetricLabel = "function";

export const BLOCKCHAIN_BLOCKS_METRIC_NAME = "blockchain_blocks";
export const BLOCKS_TO_PROCESS_METRIC_NAME = "blocks_to_process";
export const BLOCKS_REVERT_DURATION_METRIC_NAME = "blocks_revert_duration_seconds";
export const BLOCKS_REVERT_DETECT_METRIC_NAME = "blocks_revert_detect";

export const DB_CONNECTION_POOL_SIZE_METRIC_NAME = "db_connection_pool_size";
export type DbConnectionPoolSizeMetricLabels = "pool" | "type";

const metricsBuckets = [
  0.01, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 2, 2.5, 3, 4,
  5, 7, 10, 20, 30,
];

export const metricProviders: Provider<any>[] = [
  makeHistogramProvider({
    name: BLOCKS_BATCH_PROCESSING_DURATION_METRIC_NAME,
    help: "blocks batch processing duration in seconds.",
    labelNames: ["status"],
    buckets: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 7, 10, 20, 30, 40, 50, 60, 90, 120],
  }),
  makeHistogramProvider({
    name: BLOCK_PROCESSING_DURATION_METRIC_NAME,
    help: "block processing duration in seconds.",
    labelNames: ["status", "action"],
    buckets: metricsBuckets,
  }),
  makeHistogramProvider({
    name: TRANSACTION_PROCESSING_DURATION_METRIC_NAME,
    help: "transaction processing duration in seconds.",
    buckets: metricsBuckets,
  }),
  makeHistogramProvider({
    name: DELETE_OLD_BALANCES_DURATION_METRIC_NAME,
    help: "delete old balances duration in seconds.",
    buckets: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 7, 10, 20, 30, 40, 50, 60, 90, 120, 180],
  }),
  makeHistogramProvider({
    name: DELETE_ZERO_BALANCES_DURATION_METRIC_NAME,
    help: "delete zero balances duration in seconds.",
    buckets: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 7, 10, 20, 30],
  }),
  makeHistogramProvider({
    name: BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME,
    help: "blockchain rpc call duration in seconds.",
    labelNames: ["function"],
    buckets: metricsBuckets,
  }),
  makeHistogramProvider({
    name: GET_BLOCK_INFO_DURATION_METRIC_NAME,
    help: "get block info duration in seconds.",
    labelNames: ["action"],
    buckets: metricsBuckets,
  }),
  makeHistogramProvider({
    name: GET_TRANSACTION_INFO_DURATION_METRIC_NAME,
    help: "get transaction info duration in seconds.",
    buckets: metricsBuckets,
  }),
  makeHistogramProvider({
    name: GET_TOKEN_INFO_DURATION_METRIC_NAME,
    help: "get token info duration in seconds.",
    buckets: metricsBuckets,
  }),
  makeHistogramProvider({
    name: DB_COMMIT_DURATION_METRIC_NAME,
    help: "DB commit duration in seconds.",
  }),
  makeGaugeProvider({
    name: BLOCKCHAIN_BLOCKS_METRIC_NAME,
    help: "total number of blocks in the blockchain.",
  }),
  makeGaugeProvider({
    name: BLOCKS_TO_PROCESS_METRIC_NAME,
    help: "total number of remaining blocks to process.",
  }),
  makeHistogramProvider({
    name: BLOCKS_REVERT_DURATION_METRIC_NAME,
    help: "revert duration in seconds.",
    buckets: [1, 5, 10, 20, 30, 60, 120, 180, 240, 300],
  }),
  makeHistogramProvider({
    name: BLOCKS_REVERT_DETECT_METRIC_NAME,
    help: "if more than 0 indicates that block revert has happened.",
    buckets: [1],
  }),
  makeGaugeProvider({
    name: DB_CONNECTION_POOL_SIZE_METRIC_NAME,
    help: "DB connection pool size.",
    labelNames: ["pool", "type"],
  }),
];
