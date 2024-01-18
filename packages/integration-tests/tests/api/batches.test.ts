import { localConfig } from "../../src/config";
import { Helper } from "../../src/helper";

describe("Batches", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  let apiRoute: string;
  let response;

  //@id1513
  it("Verify the response via /batches", async () => {
    apiRoute = `/batches`;
    response = await helper.retryAPIrequest(apiRoute);

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

  //@id1514 //unstable due to null issue with timestamp
  xit("Verify the response via /batches/{batchNumber}", async () => {
    apiRoute = `/batches`;
    const batches = await helper.retryAPIrequest(apiRoute);
    const batchNumber = batches.body.items[0].number;
    apiRoute = apiRoute + `/${batchNumber}`;
    response = await helper.retryAPIrequest(apiRoute);

    expect(response.status).toBe(200);
    expect(response.body.number).toStrictEqual(batchNumber);
    expect(typeof response.body.timestamp).toStrictEqual("string");
    expect(typeof response.body.rootHash).toStrictEqual("string");
    expect(typeof response.body.executedAt).toStrictEqual("string");
    expect(typeof response.body.l1TxCount).toStrictEqual("number");
    expect(typeof response.body.l2TxCount).toStrictEqual("number");
    expect(typeof response.body.commitTxHash).toStrictEqual("string");
    expect(typeof response.body.committedAt).toStrictEqual("string");
    expect(typeof response.body.proveTxHash).toStrictEqual("string");
    expect(typeof response.body.provenAt).toStrictEqual("string");
    expect(typeof response.body.executeTxHash).toStrictEqual("string");
    expect(typeof response.body.l1GasPrice).toStrictEqual("string");
    expect(typeof response.body.l2FairGasPrice).toStrictEqual("string");
    expect(typeof response.body.size).toStrictEqual("number");
    expect(typeof response.body.status).toStrictEqual("string");
  });
});
