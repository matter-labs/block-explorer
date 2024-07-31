import { localConfig } from "../../src/config";
import { Helper } from "../../src/helper";

describe("Blocks", () => {
  const helper = new Helper();
  let apiRoute: string;
  let response;

  describe("/blocks", () => {
    jest.setTimeout(localConfig.standardTimeout);

    //@id1511
    it("Verify the response via /blocks", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/blocks`;
        response = await helper.performGETrequest(apiRoute);

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
    });

    //@id1512 //unstable on CI
    it("Verify the response via /blocks/{/blockNumber}", async () => {
      await helper.retryTestAction(async () => {
        const blocks = await helper.performGETrequest("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/blocks/${blockNumber}`;
        response = await helper.performGETrequest(apiRoute);

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
        expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string"));
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(typeof response.body.committedAt).toStrictEqual("string");
        expect(typeof response.body.executedAt).toStrictEqual("string");
        expect(typeof response.body.provenAt).toStrictEqual("string");
      });
    });
  });

  describe("/api?module=block", () => {
    //@id1700
    it("Verify /api?module=block&action=getblockcountdown&blockno={block_number} response", async () => {
      await helper.retryTestAction(async () => {
        const blocks = await helper.performGETrequest("/blocks");
        const blockNumber = blocks.body.items[0].number + 1;
        apiRoute = `/api?module=block&action=getblockcountdown&blockno=${blockNumber}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result.CurrentBlock).toStrictEqual("string");
        expect(typeof response.body.result.CountdownBlock).toStrictEqual("string");
        expect(typeof response.body.result.RemainingBlock).toStrictEqual("string");
        expect(typeof response.body.result.EstimateTimeInSec).toStrictEqual("string");
      });
    });

    //@id1699
    it("Verify /api?module=block&action=getblocknobytime&closest=before&timestamp={timestamp} response", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/api?module=block&action=getblocknobytime&closest=before&timestamp=1635934550`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result).toStrictEqual("string");
      });
    });

    //@id1701
    it("Verify /api?module=block&action=getblockreward&blockno={blockNumber} response", async () => {
      await helper.retryTestAction(async () => {
        const blocks = await helper.performGETrequest("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=block&action=getblockreward&blockno=${blockNumber}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result.blockNumber).toStrictEqual("string");
        expect(typeof response.body.result.timeStamp).toStrictEqual("string");
        expect(typeof response.body.result.blockMiner).toStrictEqual("string");
        expect(typeof response.body.result.blockReward).toStrictEqual("string");
        expect(typeof response.body.result.uncleInclusionReward).toStrictEqual("string");
        expect(typeof response.body.result.uncles).toStrictEqual("object");
      });
    });
  });
});
