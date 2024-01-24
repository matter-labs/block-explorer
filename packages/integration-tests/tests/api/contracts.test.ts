import { localConfig } from "../../src/config";
import { Buffer, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("API module: Contract", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  const bufferFile = "src/playbook/";
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
      await helper.retryTestAction(async () => {
        paymasterContract = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
        paymasterTx = await helper.getStringFromFile(bufferFile + Buffer.paymasterDeployTx);
        multicallCallerContract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallCaller);
        multicallCallerTx = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallCaller);
        apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=${paymasterContract},${multicallCallerContract}`;
        response = await helper.performGETrequest(apiRoute);

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
