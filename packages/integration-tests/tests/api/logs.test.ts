import { localConfig } from "../../src/config";
import { Buffer } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("API module: Logs", () => {
  jest.setTimeout(localConfig.standardTimeout); //works unstable without timeout

  const helper = new Helper();
  const bufferFile = "src/playbook/";
  const playbook = new Playbook();
  let apiRoute: string;
  let contractAddress: string;
  let response;
  let txHash: string;

  describe("/api?module=logs&action=getLogs", () => {
    beforeAll(async () => {
      await playbook.deployGreeterToL2();
      await playbook.useGreeter();
    });

    //@id1808
    it("Verify /api?module=logs&action=getLogs&page={page}&offset={offset}0&toBlock={toBlock}&fromBlock={fromBlock}&address={address} response", async () => {
      await helper.retryTestAction(async () => {
        contractAddress = await helper.getStringFromFile(bufferFile + Buffer.greeterL2);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.executeGreeterTx);
        apiRoute = `/api?module=logs&action=getLogs&page=1&offset=10&toBlock=10000&fromBlock=1&address=${contractAddress}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ address: contractAddress }));
        expect(Array.isArray(response.body.result[0].topics)).toStrictEqual(true);
        expect(typeof response.body.result[0].topics[0]).toStrictEqual("string");
        expect(response.body.result[0].topics[0].startsWith("0x")).toBe(true);
        expect(response.body.result[0].topics[0].length).toBe(66);
        expect(typeof response.body.result[0].data).toStrictEqual("string");
        expect(response.body.result[0].data.startsWith("0x")).toBe(true);
        expect(response.body.result[0].data.length).toBe(194);
        expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
        expect(response.body.result[0].blockNumber.startsWith("0x")).toBe(true);
        expect(response.body.result[0].blockNumber.length).toBeGreaterThan(2);
        expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
        expect(response.body.result[0].timeStamp.startsWith("0x")).toBe(true);
        expect(response.body.result[0].timeStamp.length).toBe(10);
        expect(typeof response.body.result[0].gasPrice).toStrictEqual("string");
        expect(response.body.result[0].gasPrice.startsWith("0x")).toBe(true);
        expect(response.body.result[0].gasPrice.length).toBe(9);
        expect(typeof response.body.result[0].gasUsed).toStrictEqual("string");
        expect(response.body.result[0].gasUsed.startsWith("0x")).toBe(true);
        expect(response.body.result[0].gasUsed.length).toBe(7);
        expect(typeof response.body.result[0].logIndex).toStrictEqual("string");
        expect(response.body.result[0].logIndex.startsWith("0x")).toBe(true);
        expect(response.body.result[0].logIndex.length).toBe(3);
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.result[0].transactionIndex).toStrictEqual("string");
        expect(response.body.result[0].transactionIndex.startsWith("0x")).toBe(true);
        expect(response.body.result[0].transactionIndex.length).toBe(3);
      });
    });
    //@id1953:I
    it("Verify /api?module=logs&action=getLogs response - Invalid address format", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/api?module=logs&action=getLogs&page=1&offset=10&toBlock=99999999&fromBlock=0&address=0x8A63F953e19aA4Ce3ED90621EeF61sE17A95c6594`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Error! Invalid address format" }));
      });
    });

    //@id1953:II
    it("Verify /api?module=logs&action=getLogs response - No record found", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/api?module=logs&action=getLogs&page=1&offset=10&toBlock=99999999&fromBlock=0&address=0x8A63F953e19aA4Ce3ED90621EeF61E17A95c6594`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "No record found" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: [] }));
      });
    });

    //@id1953:III
    it("Verify /api?module=logs&action=getLogs response - Validation failed", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/api?module=logs&action=getLogs&page=1&offset=10&toBlock=999999999999999999999999999&fromBlock=0&address=0xbf2A1ACE3B12b81bab4985f05E850AcFCCb416E0`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ result: "Validation failed (numeric string is expected)" })
        );
      });
    });

    //@id1953:IV
    it("Verify /api?module=logs&action=getLogs response - offset must not be less than 1", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/api?module=logs&action=getLogs&page=1&offset=0&toBlock=999999999999&fromBlock=0&address=0xbf2A1ACE3B12b81bab4985f05E850AcFCCb416E0`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "offset must not be less than 1" }));
      });
    });

    //@id1953:V
    it("Verify /api?module=logs&action=getLogs response - Validation failed: specified int is out of defined boundaries", async () => {
      await helper.retryTestAction(async () => {
        apiRoute = `/api?module=logs&action=getLogs&page=1&offset=10&toBlock=999999999999&fromBlock=-1&address=0xbf2A1ACE3B12b81bab4985f05E850AcFCCb416E0`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({
            result: "Validation failed: specified int is out of defined boundaries: [0;9007199254740991].",
          })
        );
      });
    });
  });
});
