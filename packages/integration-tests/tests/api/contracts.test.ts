import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Buffer, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";

describe("Contracts", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const bufferFile = "src/playbook/";
  let paymasterContract: string;
  let paymasterTx: string;

  beforeAll(async () => {
    paymasterContract = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
    paymasterTx = await helper.getStringFromFile(bufferFile + Buffer.paymasterDeployTx);
  });

  describe("/api?module=contract&action=getcontractcreation", () => {
    jest.setTimeout(localConfig.standardTimeout); //works unstable without timeout

    //@id1696
    it("Verify the response via /api?module=contract&action=getcontractcreation", async () => {
      await setTimeout(localConfig.extendedPause); //works unstable without timeout
      const apiRoute = `/api?module=contract&action=getcontractcreation&contractaddresses=${paymasterContract}`;
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
        .expect((res) => expect(res.body.result[0]).toStrictEqual(expect.objectContaining({ txHash: paymasterTx })));
    });
  });
});
