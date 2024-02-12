import { Provider } from "@nestjs/common";
import { makeHistogramProvider } from "@willsoto/nestjs-prometheus";

export const BLOCK_PROCESSING_DURATION_METRIC_NAME = "block_processing_duration_seconds";
export type BlockProcessingMetricLabels = "status" | "action";

export const TRANSACTION_PROCESSING_DURATION_METRIC_NAME = "transaction_processing_duration_seconds";
export type ProcessingActionMetricLabel = "action";

export const BALANCES_PROCESSING_DURATION_METRIC_NAME = "balances_processing_duration_seconds";

export const GET_BLOCK_INFO_DURATION_METRIC_NAME = "get_block_info_duration_seconds";
export const GET_TRANSACTION_INFO_DURATION_METRIC_NAME = "get_transaction_info_duration_seconds";
export const GET_TOKEN_INFO_DURATION_METRIC_NAME = "get_token_info_duration_seconds";

export const BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME = "blockchain_rpc_call_duration_seconds";
export type BlockchainRpcCallMetricLabel = "function";

const metricsBuckets = [
  0.01, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 2, 2.5, 3, 4,
  5, 7, 10, 20, 30,
];

export const metricProviders: Provider<any>[] = [
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
    name: BALANCES_PROCESSING_DURATION_METRIC_NAME,
    help: "balances processing duration in seconds.",
    buckets: metricsBuckets,
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
];
