import { localConfig } from "../../src/config";

describe("Stub: 200 == 200", () => {
  jest.setTimeout(localConfig.standardTimeout);

  it("Self test", async () => {
    expect(200).toBe(200);
  });
});
