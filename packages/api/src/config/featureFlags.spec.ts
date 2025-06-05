import * as featureFlags from "./featureFlags.spec";

describe("featureFlags", () => {
  it("sets default values", () => {
    expect(featureFlags).toEqual({});
  });
});
