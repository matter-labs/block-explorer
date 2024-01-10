import * as request from "supertest";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Buffer } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

xdescribe("/api", () => {
  jest.setTimeout(localConfig.standardTimeout); //works unstable without timeout
  const helper = new Helper();
  const bufferFile = "src/playbook/";
  const playbook = new Playbook();
  let contractAddress: string;
  let txHash: string;

  describe("/api?module=logs&action=getLogs", () => {
    beforeAll(async () => {
      await playbook.deployGreeterToL2();
      await playbook.useGreeter();
    });

    //@id1808
    it("Verify /api?module=logs&action=getLogs&page={page}&offset={offset}0&toBlock={toBlock}&fromBlock={fromBlock}&address={address} response", async () => {
      contractAddress = await helper.getStringFromFile(bufferFile + Buffer.greeterL2);
      txHash = await helper.getStringFromFile(bufferFile + Buffer.executeGreeterTx);

      const apiRoute = `/api?module=logs&action=getLogs&page=1&offset=10&toBlock=10000&fromBlock=1&address=${contractAddress}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.result[0]).toStrictEqual(expect.objectContaining({ address: contractAddress }))
        )
        .expect((res) => expect(Array.isArray(res.body.result[0].topics)).toStrictEqual(true))
        .expect((res) => expect(typeof res.body.result[0].topics[0]).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].topics[0].startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].topics[0].length).toBe(66))
        .expect((res) => expect(typeof res.body.result[0].data).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].data.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].data.length).toBe(194))
        .expect((res) => expect(typeof res.body.result[0].blockNumber).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].blockNumber.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].blockNumber.length).toBe(5))
        .expect((res) => expect(typeof res.body.result[0].timeStamp).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].timeStamp.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].timeStamp.length).toBe(10))
        .expect((res) => expect(typeof res.body.result[0].gasPrice).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].gasPrice.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].gasPrice.length).toBe(9))
        .expect((res) => expect(typeof res.body.result[0].gasUsed).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].gasUsed.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].gasUsed.length).toBe(7))
        .expect((res) => expect(typeof res.body.result[0].logIndex).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].logIndex.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].logIndex.length).toBe(3))
        .expect((res) => expect(res.body.result[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(typeof res.body.result[0].transactionIndex).toStrictEqual("string"))
        .expect((res) => expect(res.body.result[0].transactionIndex.startsWith("0x")).toBe(true))
        .expect((res) => expect(res.body.result[0].transactionIndex.length).toBe(3));
    });
  });
});
