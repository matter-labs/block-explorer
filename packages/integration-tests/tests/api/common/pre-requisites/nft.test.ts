import { localConfig } from "../../../../src/config";
import { Logger } from "../../../../src/entities";
import { Playbook } from "../../../../src/playbook/playbook";

describe("NFTs", () => {
  jest.setTimeout(localConfig.standardTimeout);

  let deployedToken: string;

  describe("Deploy/check the NFT", () => {
    jest.setTimeout(localConfig.standardTimeout);
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
  });
});
