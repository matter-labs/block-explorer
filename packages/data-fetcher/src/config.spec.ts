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
      port: 3001,
      blockchain: {
        rpcUrl: "http://localhost:3050",
        rpcCallDefaultRetryTimeout: 30000,
        rpcCallQuickRetryTimeout: 500,
        rpcCallConnectionTimeout: 20000,
        rpcCallConnectionQuickTimeout: 10000,
      },
    });
  });
});
