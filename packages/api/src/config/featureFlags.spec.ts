describe("featureFlags", () => {
  let env: NodeJS.ProcessEnv;

  beforeEach(async () => {
    env = process.env;
  });

  afterEach(() => {
    process.env = env;
  });

  it("sets default values", async () => {
    jest.resetModules();
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

  it("sets prividium as true when PRIVIDIUM is not set", async () => {
    process.env.PRIVIDIUM = undefined;
    jest.resetModules();
    const featureFlags = await import("./featureFlags");
    expect(featureFlags.prividium).toBe(true);
  });

  it("sets prividium as false when PRIVIDIUM is set to false", async () => {
    process.env.PRIVIDIUM = "false";
    jest.resetModules();
    const featureFlags = await import("./featureFlags");
    expect(featureFlags.prividium).toBe(false);
  });

  it("sets prividium as true when PRIVIDIUM is set to true", async () => {
    process.env.PRIVIDIUM = "true";
    jest.resetModules();
    const featureFlags = await import("./featureFlags");
    expect(featureFlags.prividium).toBe(true);
  });

  it("sets prividium as true when PRIVIDIUM is set to any other value", async () => {
    process.env.PRIVIDIUM = "other";
    jest.resetModules();
    const featureFlags = await import("./featureFlags");
    expect(featureFlags.prividium).toBe(true);
  });
});
