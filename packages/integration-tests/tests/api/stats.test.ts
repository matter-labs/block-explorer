import { localConfig } from "../../src/config";
import { Helper } from "../../src/helper";

describe("Stats", () => {
  jest.setTimeout(localConfig.standardTimeout); //works unstable without timeout

  const helper = new Helper();
  let apiRoute: string;
  let response;

  //@id1515
  it("Verify the response via /stats", async () => {
    await helper.retryTestAction(async () => {
      apiRoute = `/stats`;
      response = await helper.performGETrequest(apiRoute);

      expect(response.status).toBe(200);
      expect(typeof response.body.lastSealedBatch).toStrictEqual("number");
      expect(typeof response.body.lastVerifiedBatch).toStrictEqual("number");
      expect(typeof response.body.lastSealedBlock).toStrictEqual("number");
      expect(typeof response.body.lastVerifiedBlock).toStrictEqual("number");
      expect(typeof response.body.totalTransactions).toStrictEqual("number");
    });
  });

  //@id1955
  it("Verify the response via /action=ethprice endpoint - incorrect token name", async () => {
    await helper.retryTestAction(async () => {
      apiRoute = `/api?module=stats&action=ethprisce2`;
      response = await helper.performGETrequest(apiRoute);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ result: "Error! Missing Or invalid Action name" }));
    });
  });
});
