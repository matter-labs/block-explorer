import { ConfigService } from "@nestjs/config";

import { makePrividiumToggleProvider } from "./prividium-provider.factory";

describe("makePrividiumToggleProvider", () => {
  it("returns prividium implementation when feature flag enabled", () => {
    class Standard {}
    class Prividium {}

    const provider = makePrividiumToggleProvider("TOKEN", Standard, Prividium);
    const config = { get: jest.fn().mockReturnValue(true) } as unknown as ConfigService;
    const standard = new Standard();
    const prividium = new Prividium();

    const instance = provider.useFactory(config, standard, prividium);
    expect(config.get).toHaveBeenCalledWith("featureFlags.prividium");
    expect(instance).toBe(prividium);
  });

  it("returns standard implementation when feature flag disabled", () => {
    class Standard {}
    class Prividium {}

    const provider = makePrividiumToggleProvider("TOKEN", Standard, Prividium);
    const config = { get: jest.fn().mockReturnValue(false) } as unknown as ConfigService;
    const standard = new Standard();
    const prividium = new Prividium();

    const instance = provider.useFactory(config, standard, prividium);
    expect(config.get).toHaveBeenCalledWith("featureFlags.prividium");
    expect(instance).toBe(standard);
  });
});
