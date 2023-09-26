import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Logger, Token } from "../../src/entities";
import { Playbook } from "../../src/playbook/playbook";

describe("NFTs", () => {
  jest.setTimeout(localConfig.standardTimeout);

  let deployedToken: string;

  describe("Deploy/check the NFT", () => {
    jest.setTimeout(localConfig.standardTimeout);
    let deployedToken: string;
    const playbook = new Playbook();

    //@id672
    it("Deploy the NFT to L1", async () => {
      deployedToken = await playbook.deployNFTtoL1();
      expect(deployedToken).toContain(Logger.txHashStartsWith);
    });

    //@id671
    it("Deploy the NFT to L2", async () => {
      deployedToken = await playbook.deployNFTtoL2();
      expect(deployedToken).toContain(Logger.txHashStartsWith);
    });

    //@id1457
    it("Verify deployed to L2 NFT via /address/{address}", async () => {
      await setTimeout(localConfig.extendedPause);
      const apiRoute = `/address/${deployedToken}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual(
            expect.objectContaining({
              type: "contract",
              address: deployedToken,
              balances: {
                [`${deployedToken}`]: {
                  balance: "1",
                  token: null,
                },
              },
            })
          )
        );
    });
  });
});
