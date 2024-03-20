import { localConfig } from "../../src/config";
import { Helper } from "../../src/helper";

describe("Stats", () => {
  jest.setTimeout(localConfig.standardTimeout); //works unstable without timeout

  const helper = new Helper();
  let apiRoute: string;
  let response;

  //@id1515
  it("Verify the response via /stats", async () => {
    await helper.runRetriableTestAction(async () => {
      apiRoute = `/stats`;
      response = await helper.performBlockExplorerApiGetRequest(apiRoute);

      expect(response.status).toBe(200);
      expect(typeof response.body.lastSealedBatch).toStrictEqual("number");
      expect(typeof response.body.lastVerifiedBatch).toStrictEqual("number");
      expect(typeof response.body.lastSealedBlock).toStrictEqual("number");
      expect(typeof response.body.lastVerifiedBlock).toStrictEqual("number");
      expect(typeof response.body.totalTransactions).toStrictEqual("number");
    });
  });
});
