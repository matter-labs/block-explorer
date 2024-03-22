import { localConfig } from "../../src/config";
import { Buffer, Path, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("API module: Contract", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  let apiRoute: string;
  let paymasterContract: string;
  let paymasterTx: string;
  let multicallCallerContract: string;
  let multicallCallerTx: string;
  let response;

  describe("/api?module=contract&action=getcontractcreation", () => {
    beforeAll(async () => {
      await playbook.deployViaPaymaster();
      await playbook.deployMultiCallContracts();
    });

    //@id1696
    it("Verify /api?module=contract&action=getcontractcreation&contractaddresses={address1},{address2} response", async () => {
      await helper.runRetriableTestAction(async () => {
        paymasterContract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymaster);
        paymasterTx = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymasterDeployTx);
        multicallCallerContract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallCaller);
        multicallCallerTx = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallCaller);
        apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=${paymasterContract},${multicallCallerContract}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ contractAddress: paymasterContract }));
        expect(response.body.result[0]).toStrictEqual(
          expect.objectContaining({ contractCreator: Wallets.richWalletAddress })
        );
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ txHash: paymasterTx }));
        expect(response.body.result[1]).toStrictEqual(
          expect.objectContaining({ contractAddress: multicallCallerContract })
        );
        expect(response.body.result[1]).toStrictEqual(
          expect.objectContaining({ contractCreator: Wallets.richWalletAddress })
        );
        expect(response.body.result[1]).toStrictEqual(expect.objectContaining({ txHash: multicallCallerTx }));
      });
    });

    //@id1966
    it("Verify /checkverifystatus endpoint response", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=checkverifystatus&guid=44071123123`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ result: "Contract verification submission not found" })
        );
      });
    });

    //@id1952:I
    it("Verify /getcontractcreation endpoint - Invalid contract addresses", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=0x0E03197d697B592E5AE49EC14E952cddc9b28e14s,0x0E03197d697B592E5AE49EC14E952cddc9b28e14`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Invalid contract addresses" }));
      });
    });

    //@id1952:II
    it("Verify /getcontractcreation endpoint - Maximum 5 contract addresses per request check", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=0x000000000000000000000000000000000000800A,0x5B09802d62d213c4503B4b1Ef5F727ef62c9F4eF,0x082faDe8b84B18C441d506e1D3a43a387Cc59D20,0xBBeB516fb02a01611cBBE0453Fe3c580D7281011,0x770E221EC6F3e8A2E2E168399bb3aa56a63E397d,0x122528C80166a74f608B2fC13c2c02C51F2e3423`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ result: "Maximum 5 contract addresses per request" })
        );
      });
    });

    //@id1952:III
    it("Verify /getcontractcreation endpoint - Use account address in the request", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=0x0000000000000000000000000000000000008007`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "No data found" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: null }));
      });
    });

    //@id1950
    it("Verify /getcontractcreation endpoint - Use account address in the request", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getsourcecode&address=0xd88D4d772D4acaD83452b412bc99456aA2a21dc7`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result[0]).toStrictEqual(
          expect.objectContaining({ ABI: "Contract source code not verified" })
        );
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ CompilerVersion: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ ConstructorArguments: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ ContractName: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ EVMVersion: "Default" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ Implementation: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ Library: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ LicenseType: "Unknown" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ OptimizationUsed: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ Proxy: "0" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ Runs: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ SourceCode: "" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ SwarmSource: "" }));
      });
    });

    //@id1949
    it("Verify /getabi endpoint", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getabi&address=0xd88D4d772D4acaD83452b412bc99456aA2a21dc7`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Contract source code not verified" }));
      });
    });
  });
});
