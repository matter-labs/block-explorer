import config from "./config";

describe("config", () => {
  const env = process.env;
  let defaultConfig;

  beforeAll(() => {
    process.env = {};

    defaultConfig = {
      port: 3040,
      blockchain: {
        rpcUrl: "http://localhost:3050",
        rpcCallDefaultRetryTimeout: 30000,
        rpcCallQuickRetryTimeout: 5000,
        rpcCallRetriesMaxTotalTimeout: 120000,
        rpcCallConnectionTimeout: 60000,
        rpcCallConnectionQuickTimeout: 10000,
        rpcBatchMaxCount: 10,
        rpcBatchMaxSizeBytes: 1048576,
        rpcBatchStallTimeMs: 0,
      },
      maxBlocksBatchSize: 20,
      gracefulShutdownTimeoutMs: 0,
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("sets default values", () => {
    expect(config()).toEqual(defaultConfig);
  });

  describe("when RPC_BATCH_MAX_COUNT is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        RPC_BATCH_MAX_COUNT: "40",
      };
    });

    it("sets rpcBatchMaxCount to the value from env vars", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        blockchain: {
          ...defaultConfig.blockchain,
          rpcBatchMaxCount: 40,
        },
      });
    });
  });

  describe("when RPC_BATCH_MAX_SIZE_BYTES is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        RPC_BATCH_MAX_SIZE_BYTES: "50",
      };
    });

    it("sets rpcBatchMaxSizeBytes to the value from env vars", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        blockchain: {
          ...defaultConfig.blockchain,
          rpcBatchMaxSizeBytes: 50,
        },
      });
    });
  });

  describe("when RPC_BATCH_STALL_TIME_MS is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        RPC_BATCH_STALL_TIME_MS: "7",
      };
    });

    it("sets rpcBatchMaxSizeBytes to the value from env vars", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        blockchain: {
          ...defaultConfig.blockchain,
          rpcBatchStallTimeMs: 7,
        },
      });
    });
  });
});
