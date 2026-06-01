import config from "./config";

describe("config", () => {
  const env = process.env;
  let defaultConfig;

  beforeAll(() => {
    process.env = {};

    defaultConfig = {
      port: 3040,
      trustedLegacyBridgeAddresses: [],
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
      healthChecks: {
        rpcHealthCheckTimeoutMs: 20_000,
      },
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("sets default values", () => {
    expect(config()).toEqual(defaultConfig);
  });

  describe("when TRUSTED_LEGACY_BRIDGE_ADDRESSES is specified in env vars", () => {
    beforeEach(() => {
      process.env = {
        TRUSTED_LEGACY_BRIDGE_ADDRESSES:
          "0xE1d6A50E7101C8f8db77352897Ee3F1aC53f782b, 0x11F943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102",
      };
    });

    it("parses the addresses into a lower-cased, trimmed list", () => {
      expect(config()).toEqual({
        ...defaultConfig,
        trustedLegacyBridgeAddresses: [
          "0xe1d6a50e7101c8f8db77352897ee3f1ac53f782b",
          "0x11f943b2c77b743ab90f4a0ae7d5a4e7fca3e102",
        ],
      });
    });
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
