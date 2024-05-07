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
      port: 3040,
      blockchain: {
        rpcUrl: "http://localhost:3050",
        rpcCallDefaultRetryTimeout: 30000,
        rpcCallQuickRetryTimeout: 5000,
        rpcCallRetriesMaxTotalTimeout: 120000,
        rpcCallConnectionTimeout: 60000,
        rpcCallConnectionQuickTimeout: 10000,
        wsMaxConnections: 5,
        useWebSocketsForTransactions: false,
      },
      maxBlocksBatchSize: 20,
      gracefulShutdownTimeoutMs: 0,
    });
  });
});
