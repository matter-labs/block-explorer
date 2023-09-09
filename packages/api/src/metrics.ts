import { Provider } from "@nestjs/common";
import { makeHistogramProvider, makeGaugeProvider } from "@willsoto/nestjs-prometheus";

export const REQUEST_DURATION_METRIC_NAME = "request_duration_seconds";
export type RequestDurationMetricLabels = "method" | "statusCode" | "path";

export const DB_CONNECTION_POOL_SIZE_METRIC_NAME = "db_connection_pool_size";
export type DbConnectionPoolSizeMetricLabels = "pool" | "type";

export const metricProviders: Provider<any>[] = [
  makeHistogramProvider({
    name: REQUEST_DURATION_METRIC_NAME,
    help: "HTTP request processing duration in seconds.",
    labelNames: ["method", "path", "statusCode"],
  }),
  makeGaugeProvider({
    name: DB_CONNECTION_POOL_SIZE_METRIC_NAME,
    help: "DB connection pool size.",
    labelNames: ["pool", "type"],
  }),
];
