import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";

describe("/batches", () => {
  jest.setTimeout(localConfig.standardTimeout);

  //@id1513
  it("Verify the response via /batches", async () => {
    await setTimeout(localConfig.standardPause); //works unstable without timeout

    const apiRoute = `/batches`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
      .expect((res) => expect(res.body.items.length).toBeGreaterThanOrEqual(1))
      .expect((res) => expect(typeof res.body.items[0].number).toStrictEqual("number"))
      .expect((res) => expect(res.body.items[0].number).toBeGreaterThanOrEqual(0))
      .expect((res) => expect(typeof res.body.items[0].timestamp).toStrictEqual("string"))
      .expect((res) => expect(res.body.items[0].timestamp.length).toBe(24))
      .expect((res) => expect(typeof res.body.items[0].rootHash).toStrictEqual("string"))
      .expect((res) => expect(res.body.items[0].rootHash.length).toBe(66))
      .expect((res) => expect(res.body.items[0].rootHash.startsWith("0x")).toBe(true))
      .expect((res) => expect(typeof res.body.items[0].executedAt).toStrictEqual("string"))
      .expect((res) => expect(res.body.items[0].executedAt.length).toBe(24))
      .expect((res) => expect(typeof res.body.items[0].l1TxCount).toStrictEqual("number"))
      .expect((res) => expect(res.body.items[0].l1TxCount).toBeGreaterThanOrEqual(0))
      .expect((res) => expect(typeof res.body.items[0].l2TxCount).toStrictEqual("number"))
      .expect((res) => expect(res.body.items[0].l2TxCount).toBeGreaterThanOrEqual(0))
      .expect((res) => expect(typeof res.body.items[0].size).toStrictEqual("number"))
      .expect((res) => expect(res.body.items[0].size).toBeGreaterThanOrEqual(0))
      .expect((res) => expect(typeof res.body.items[0].status).toStrictEqual("string"))
      .expect((res) => expect(res.body.items[0].status.length).toBeGreaterThanOrEqual(6))
      .expect((res) => expect(typeof res.body.meta.totalItems).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.meta.itemCount).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.meta.itemsPerPage).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.meta.totalPages).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.meta.currentPage).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.links.first).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.links.previous).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.links.next).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.links.last).toStrictEqual("string"));
  });

  //@id1514
  it("Verify the response via /batches/{batchNumber}", async () => {
    await setTimeout(localConfig.standardPause); //works unstable without timeout

    const batches = await request(environment.blockExplorerAPI).get("/batches");

    const batchNumber = batches.body.items[0].number;

    const apiRoute = `/batches/${batchNumber}`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body.number).toStrictEqual(batchNumber))
      .expect((res) => expect(typeof res.body.timestamp).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.rootHash).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.executedAt).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.l1TxCount).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.l2TxCount).toStrictEqual("number"))
      .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.committedAt).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.proveTxHash).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.provenAt).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.executeTxHash).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.l1GasPrice).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.l2FairGasPrice).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.size).toStrictEqual("number"))
      .expect((res) => expect(res.body.status).toStrictEqual("verified"));
  });
});
