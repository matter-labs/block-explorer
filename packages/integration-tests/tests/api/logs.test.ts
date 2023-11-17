import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Buffer, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";

describe("Logs", () => {
  jest.setTimeout(localConfig.standardTimeout); //works unstable without timeout
  const helper = new Helper();
  const bufferFile = "src/playbook/";
  let contractAddress: string;

  beforeAll(async () => {
    contractAddress = await helper.getStringFromFile(bufferFile + Buffer.customToken);
  });

  describe("/api?module=logs&action=getLogs", () => {
    //@id1808
    it("Verify the response via /api?module=logs&action=getLogs", async () => {
      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      const apiRoute = `/api?module=logs&action=getLogs&page=1&offset=1&toBlock=1000&fromBlock=1&address=${contractAddress}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.result[0]).toStrictEqual(expect.objectContaining({ address: contractAddress }))
        )
        .expect((res) => expect(typeof res.body.result[0].topics[0]).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].data).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].blockNumber).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].timeStamp).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].gasPrice).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].gasUsed).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].logIndex).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].transactionHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result[0].transactionIndex).toStrictEqual("string"));
    });
  });
});
