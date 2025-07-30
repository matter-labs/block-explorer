describe("featureFlags", () => {
  const env = process.env;

  beforeEach(async () => {
    process.env = {
      NODE_ENV: "test",
    };
  });

  afterEach(() => {
    process.env = env;
    jest.resetModules();
  });

  describe("featureFlags", () => {
    it("sets default values", async () => {
      const featureFlags = await import("./featureFlags");
      expect(featureFlags).toEqual({
        prividium: false,
        disableExternalAPI: false,
        swagger: {
          enabled: true,
          bffEnabled: true,
        },
      });
    });

    it("sets prividium as false when PRIVIDIUM is set to false", async () => {
      process.env.PRIVIDIUM = "false";
      const featureFlags = await import("./featureFlags");
      expect(featureFlags.prividium).toBe(false);
    });

    it("sets prividium as true when PRIVIDIUM is set to true", async () => {
      process.env.PRIVIDIUM = "true";
      const featureFlags = await import("./featureFlags");
      expect(featureFlags.prividium).toBe(true);
    });

    it("sets prividium as false when PRIVIDIUM is set to any other value", async () => {
      process.env.PRIVIDIUM = "other";
      const featureFlags = await import("./featureFlags");
      expect(featureFlags.prividium).toBe(false);
    });
  });
});
