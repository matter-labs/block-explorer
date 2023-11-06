import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";

describe("/blocks", () => {
  jest.setTimeout(localConfig.standardTimeout);

  //@id1511
  it("Verify the response via /blocks", async () => {
    await setTimeout(localConfig.extendedPause); //works unstable without timeout

    const apiRoute = `/blocks`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
      .expect((res) => expect(res.body.items.length).toBeGreaterThan(1))
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

  //@id1512
  it("Verify the response via /blocks/{/blockNumber}", async () => {
    await setTimeout(localConfig.standardTimeout); //works unstable without timeout

    const blocks = await request(environment.blockExplorerAPI).get("/blocks");

    const blockNumber = blocks.body.items[0].number;

    const apiRoute = `/blocks/${blockNumber}`;

    return (
      request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.number).toStrictEqual(blockNumber))
        .expect((res) => expect(typeof res.body.hash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.timestamp).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.gasUsed).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.l1BatchNumber).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.l1TxCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.l2TxCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.parentHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.gasLimit).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.baseFeePerGas).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.extraData).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.size).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.status).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.isL1BatchSealed).toStrictEqual("boolean"))
        .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string"))
        // .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string")) //unstable on a CI
        .expect((res) => expect(typeof res.body.proveTxHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.committedAt).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.executedAt).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.provenAt).toStrictEqual("string"))
    );
  });
});
