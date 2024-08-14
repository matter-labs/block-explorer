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
        rpcCallDefaultRetryTimeout: 300000,
        rpcCallQuickRetryTimeout: 50000,
        rpcCallRetriesMaxTotalTimeout: 1200000,
        rpcCallConnectionTimeout: 600000,
        rpcCallConnectionQuickTimeout: 100000,
        wsMaxConnections: 10,
        useWebSocketsForTransactions: false,
      },
      maxBlocksBatchSize: 20,
    });
  });
});
