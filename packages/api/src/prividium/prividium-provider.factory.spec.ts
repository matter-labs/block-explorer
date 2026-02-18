import { ConfigService } from "@nestjs/config";

import { createPrividiumToggleProvider } from "./prividium-provider.factory";
import { LogVisibilityPolicy } from "./policies/logVisibility.policy";

describe("createPrividiumToggleProvider", () => {
  it("returns prividium implementation when feature flag enabled", () => {
    class Prividium {}

    const provider = createPrividiumToggleProvider(LogVisibilityPolicy, Prividium);
    const config = { get: jest.fn().mockReturnValue(true) } as unknown as ConfigService;
    const prividium = new Prividium();

    const instance = provider.useFactory(config, prividium);
    expect(config.get).toHaveBeenCalledWith("featureFlags.prividium");
    expect(instance).toBe(prividium);
  });

  it("returns standard implementation when feature flag disabled", () => {
    class Prividium {}

    const provider = createPrividiumToggleProvider(LogVisibilityPolicy, Prividium);
    const config = { get: jest.fn().mockReturnValue(false) } as unknown as ConfigService;
    const prividium = new Prividium();

    const instance = provider.useFactory(config, prividium);
    expect(config.get).toHaveBeenCalledWith("featureFlags.prividium");
    expect(instance).toBe(null);
  });
});
