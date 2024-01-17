import { localConfig } from "../../src/config";
import { Helper } from "../../src/helper";

describe("Blocks", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  let apiRoute: string;
  let response;

  //@id1511
  it("Verify the response via /blocks", async () => {
    apiRoute = `/blocks`;
    response = await helper.retryAPIrequest(apiRoute);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toStrictEqual(true);
    expect(response.body.items.length).toBeGreaterThan(1);
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

  //@id1512 //unstable on CI
  xit("Verify the response via /blocks/{/blockNumber}", async () => {
    const blocks = await await helper.retryAPIrequest("/blocks");
    const blockNumber = blocks.body.items[0].number;
    apiRoute = `/blocks/${blockNumber}`;
    response = await helper.retryAPIrequest(apiRoute);

    expect(response.status).toBe(200);
    expect(response.body.number).toStrictEqual(blockNumber);
    expect(typeof response.body.hash).toStrictEqual("string");
    expect(typeof response.body.timestamp).toStrictEqual("string");
    expect(typeof response.body.gasUsed).toStrictEqual("string");
    expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
    expect(typeof response.body.l1TxCount).toStrictEqual("number");
    expect(typeof response.body.l2TxCount).toStrictEqual("number");
    expect(typeof response.body.parentHash).toStrictEqual("string");
    expect(typeof response.body.gasLimit).toStrictEqual("string");
    expect(typeof response.body.baseFeePerGas).toStrictEqual("string");
    expect(typeof response.body.extraData).toStrictEqual("string");
    expect(typeof response.body.size).toStrictEqual("number");
    expect(typeof response.body.status).toStrictEqual("string");
    expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
    expect(typeof response.body.commitTxHash).toStrictEqual("string");
    // .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string")) //unstable on a CI
    expect(typeof response.body.proveTxHash).toStrictEqual("string");
    expect(typeof response.body.committedAt).toStrictEqual("string");
    expect(typeof response.body.executedAt).toStrictEqual("string");
    expect(typeof response.body.provenAt).toStrictEqual("string");
  });
});

describe("/api?module=block", () => {
  //@id1700
  it("Verify /api?module=block&action=getblockcountdown&blockno={block_number} response", async () => {
    const blocks = await request(environment.blockExplorerAPI).get("/blocks");

    const blockNumber = blocks.body.items[0].number + 1;
    const apiRoute = `/api?module=block&action=getblockcountdown&blockno=${blockNumber}`;
    await setTimeout(localConfig.extendedPause); //works unstable without timeout

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
      .expect((res) => expect(typeof res.body.result.CurrentBlock).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.CountdownBlock).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.RemainingBlock).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.EstimateTimeInSec).toStrictEqual("string"));
  });

  //@id1699
  it("Verify /api?module=block&action=getblocknobytime&closest=before&timestamp={timestamp} response", async () => {
    const apiRoute = `/api?module=block&action=getblocknobytime&closest=before&timestamp=1635934550`;
    await setTimeout(localConfig.extendedPause); //works unstable without timeout

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
      .expect((res) => expect(typeof res.body.result).toStrictEqual("string"));
  });

  //@id1701
  it("Verify /api?module=block&action=getblockreward&blockno={blockNumber} response", async () => {
    const blocks = await request(environment.blockExplorerAPI).get("/blocks");

    const blockNumber = blocks.body.items[0].number;
    const apiRoute = `/api?module=block&action=getblockreward&blockno=${blockNumber}`;
    await setTimeout(localConfig.extendedPause); //works unstable without timeout

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
      .expect((res) => expect(typeof res.body.result.blockNumber).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.timeStamp).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.blockMiner).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.blockReward).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.uncleInclusionReward).toStrictEqual("string"))
      .expect((res) => expect(typeof res.body.result.uncles).toStrictEqual("object"));
  });
});
