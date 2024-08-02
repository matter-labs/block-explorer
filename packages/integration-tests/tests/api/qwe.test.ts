import { localConfig } from "../../src/config";

describe("A stub", () => {
  jest.setTimeout(localConfig.standardTimeout);
  //@id1513
  it("Self test", async () => {
    expect(200).toBe(200);
  });
});
