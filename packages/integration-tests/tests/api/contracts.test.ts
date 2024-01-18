import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Buffer, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("API module: Contract", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  const bufferFile = "src/playbook/";
  let paymasterContract: string;
  let paymasterTx: string;
  let multicallCallerContract: string;
  let multicallCallerTx: string;

  describe("/api?module=contract&action=getcontractcreation", () => {
    beforeAll(async () => {
      await playbook.deployViaPaymaster();
      await playbook.deployMultiCallContracts();
    });

    //@id1696
    it("Verify /api?module=contract&action=getcontractcreation&contractaddresses={address1},{address2} response", async () => {
      await setTimeout(localConfig.standardPause);
      paymasterContract = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
      paymasterTx = await helper.getStringFromFile(bufferFile + Buffer.paymasterDeployTx);
      multicallCallerContract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallCaller);
      multicallCallerTx = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallCaller);
      const apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=${paymasterContract},${multicallCallerContract}`;
      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.result[0]).toStrictEqual(expect.objectContaining({ contractAddress: paymasterContract }))
        )
        .expect((res) =>
          expect(res.body.result[0]).toStrictEqual(
            expect.objectContaining({ contractCreator: Wallets.richWalletAddress })
          )
        )
        .expect((res) => expect(res.body.result[0]).toStrictEqual(expect.objectContaining({ txHash: paymasterTx })))
        .expect((res) =>
          expect(res.body.result[1]).toStrictEqual(
            expect.objectContaining({ contractAddress: multicallCallerContract })
          )
        )
        .expect((res) =>
          expect(res.body.result[1]).toStrictEqual(
            expect.objectContaining({ contractCreator: Wallets.richWalletAddress })
          )
        )
        .expect((res) =>
          expect(res.body.result[1]).toStrictEqual(expect.objectContaining({ txHash: multicallCallerTx }))
        );
    });
  });
});
