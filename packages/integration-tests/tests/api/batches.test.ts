import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Helper } from "../../src/helper";

describe("Batches", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  let apiRoute: string;
  let response: any;

  //@id1513
  it("Verify the response via /batches", async () => {
    apiRoute = `/batches`;
    response = await helper.retryAPIrequest(apiRoute, false);

    expect(Array.isArray(response.body.items)).toStrictEqual(true);
    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
    expect(typeof response.body.meta.totalItems).toStrictEqual("number");
    expect(typeof response.body.meta.itemCount).toStrictEqual("number");
    expect(typeof response.body.meta.itemsPerPage).toStrictEqual("number");
    expect(typeof response.body.meta.totalPages).toStrictEqual("number");
    expect(typeof response.body.meta.currentPage).toStrictEqual("number");
    expect(typeof response.body.links.first).toStrictEqual("string");
    expect(typeof response.body.links.previous).toStrictEqual("string");
    expect(typeof response.body.links.next).toStrictEqual("string");
    expect(typeof response.body.links.last).toStrictEqual("string");
  });

  //@id1514
  it("Verify the response via /batches/{batchNumber}", async () => {
    await setTimeout(localConfig.extendedPause); //works unstable without timeout

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
      .expect((res) => expect(typeof res.body.status).toStrictEqual("string"));
  });
});
