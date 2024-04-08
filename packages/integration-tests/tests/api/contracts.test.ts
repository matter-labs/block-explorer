import { localConfig } from "../../src/config";
import { Buffer, Path, Wallets } from "../../src/constants";
import { Contracts } from "../../src/constants";
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

    //id1851 @Sepolia
    it("Verify /api?module=contract&action=checkverifystatus response", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=checkverifystatus&guid=3177`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Pass - Verified" }));
      });
    });

    //id1695 @Sepolia
    it("Verify /api?module=contract&action=getabi response", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getabi&address=${Contracts.greeterContractSepolia}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result).toStrictEqual("string");
      });
    });

    //id1802 @Sepolia
    it("Verify /api?module=contract&action=getsourcecode response", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=contract&action=getsourcecode&address=${Contracts.greeterContractSepolia}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute, "sepolia");

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result[0].ABI).toStrictEqual("string");
        expect(typeof response.body.result[0].SourceCode).toStrictEqual("string");
        expect(typeof response.body.result[0].ConstructorArguments).toStrictEqual("string");
        expect(typeof response.body.result[0].ContractName).toStrictEqual("string");
        expect(typeof response.body.result[0].EVMVersion).toStrictEqual("string");
        expect(typeof response.body.result[0].OptimizationUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].Library).toStrictEqual("string");
        expect(typeof response.body.result[0].LicenseType).toStrictEqual("string");
        expect(typeof response.body.result[0].CompilerVersion).toStrictEqual("string");
        expect(typeof response.body.result[0].Runs).toStrictEqual("string");
        expect(typeof response.body.result[0].SwarmSource).toStrictEqual("string");
        expect(typeof response.body.result[0].Proxy).toStrictEqual("string");
        expect(typeof response.body.result[0].Implementation).toStrictEqual("string");
        expect(typeof response.body.result[0].ZkCompilerVersion).toBeTruthy();
      });
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
  });
});
