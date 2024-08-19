import { localConfig } from "../../src/config";
import { Buffer, Token } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Transactions", () => {
  jest.setTimeout(localConfig.extendedTimeout);

  const helper = new Helper();
  const bufferFile = "src/playbook/";
  const playbook = new Playbook();
  let apiRoute: string;
  let contract: string;
  let txHash: string;
  let response;

  beforeAll(async () => {
    const customToken = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
    await playbook.withdrawETHtoOtherAddress();
    await playbook.withdrawERC20(customToken);
    await playbook.withdrawERC20toOtherAddress(customToken);
    await playbook.withdrawETH();
    await playbook.deployMultiTransferETH();
    await playbook.useMultiTransferETH();
    await playbook.deployGreeterToL2();
    await playbook.useGreeter();
    await playbook.deployMultiCallContracts();
    await playbook.useMultiCallContracts();
  });

  describe("/transactions/${txHash}/logs", () => {
    //@id1507
    it("Verify the transaction via /transactions/{transactionHash}/logs", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.greeterL2);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.executeGreeterTx);
        apiRoute = `/transactions/${txHash}/logs`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ address: Token.ETHER_ERC20_Address }));
        expect(Array.isArray(response.body.items[0].topics)).toStrictEqual(true);
        expect(typeof response.body.items[0].data).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[0].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[0].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ address: Token.ETHER_ERC20_Address }));
        expect(Array.isArray(response.body.items[1].topics)).toStrictEqual(true);
        expect(typeof response.body.items[1].data).toStrictEqual("string");
        expect(typeof response.body.items[1].blockNumber).toStrictEqual("number");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[1].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[1].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[1].timestamp).toStrictEqual("string");
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ address: contract }));
        expect(Array.isArray(response.body.items[2].topics)).toStrictEqual(true);
        expect(typeof response.body.items[2].data).toStrictEqual("string");
        expect(typeof response.body.items[2].blockNumber).toStrictEqual("number");
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[2].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[2].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[2].timestamp).toStrictEqual("string");
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalItems: 3 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemCount: 3 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemsPerPage: 10 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalPages: 1 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ currentPage: 1 }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` })
        );
        expect(response.body.links).toStrictEqual(expect.objectContaining({ previous: "" }));
        expect(response.body.links).toStrictEqual(expect.objectContaining({ next: "" }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
        );
      });
    });
  });

  describe("/transactions", () => {
    //@id1506
    it("Verify the transaction via /transactions", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/transactions`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toStrictEqual(true);
        expect(response.body.items.length).toBe(10);
        expect(typeof response.body.items[0].hash).toStrictEqual("string");
        expect(response.body.items[0].hash.length).toBe(66);
        expect(typeof response.body.items[0].to).toStrictEqual("string");
        expect(response.body.items[0].to.length).toBe(42);
        expect(typeof response.body.items[0].from).toStrictEqual("string");
        expect(response.body.items[0].from.length).toBe(42);
        expect(typeof response.body.items[0].data).toStrictEqual("string");
        expect(response.body.items[0].data.length).toBeGreaterThan(0);
        expect(typeof response.body.items[0].value).toStrictEqual("string");
        expect(response.body.items[0].value.length).toBeGreaterThanOrEqual(1);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(typeof response.body.items[0].fee).toStrictEqual("string");
        expect(response.body.items[0].fee.length).toBe(13);
        expect(typeof response.body.items[0].nonce).toStrictEqual("number");
        expect(response.body.items[0].nonce).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.items[0].gasLimit).toStrictEqual("string");
        expect(typeof response.body.items[0].gasPrice).toStrictEqual("string");
        expect(typeof response.body.items[0].gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.items[0].maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.items[0].maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0].blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.items[0].l1BatchNumber).toStrictEqual("number");
        expect(response.body.items[0].l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.items[0].blockHash).toStrictEqual("string");
        expect(response.body.items[0].blockHash.length).toBe(66);
        expect(typeof response.body.items[0].type).toStrictEqual("number");
        expect(response.body.items[0].type).toBeGreaterThanOrEqual(0);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.items[0].receivedAt).toStrictEqual("string");
        expect(response.body.items[0].receivedAt.length).toBe(24);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.items[0].status).toStrictEqual("string");
        expect(typeof response.body.items[0].commitTxHash).toStrictEqual("string");
        expect(response.body.items[0].commitTxHash.length).toBe(66);
        expect(typeof response.body.items[0].executeTxHash).toStrictEqual("string");
        expect(response.body.items[0].executeTxHash.length).toBe(66);
        expect(typeof response.body.items[0].proveTxHash).toStrictEqual("string");
        expect(response.body.items[0].proveTxHash.length).toBe(66);
        expect(typeof response.body.items[0].isL1BatchSealed).toStrictEqual("boolean");
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
  });

  describe("/api?module=transaction", () => {
    //@id1697
    it("Verify /api?module=transaction&action=getstatus response", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthTransfer);
        apiRoute = `/api?module=transaction&action=getstatus&txhash=${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result).toStrictEqual(expect.objectContaining({ isError: "0", errDescription: "" }));
      });
    });

    //@id1698
    it("Verify /api?module=transaction&action=gettxreceiptstatus response", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthTransfer);
        apiRoute = `/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result.status).toStrictEqual("string");
      });
    });
  });
});
