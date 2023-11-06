import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";

describe("/stats", () => {
  //@id1515
  it("Verify the response via /stats", async () => {
    await setTimeout(localConfig.standardPause); //works unstable without timeout

    const apiRoute = `/stats`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(typeof res.body.lastSealedBatch).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.lastVerifiedBatch).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.lastSealedBlock).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.lastVerifiedBlock).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.totalTransactions).toStrictEqual("number"));
  });
});
