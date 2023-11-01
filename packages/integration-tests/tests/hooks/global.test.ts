import { localConfig } from "../../src/config";
import { Buffer, Logger } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Tokens", () => {
  jest.setTimeout(localConfig.standardTimeout);

  let deployedToken: string;

  describe("Deploy/check the custom ERC20 tokens", () => {
    const playbook = new Playbook();

    //@id603
    it("Deploy custom ERC20 token to L2", async () => {
      deployedToken = await playbook.deployERC20toL2();
      expect(deployedToken).toContain(Logger.txHashStartsWith);
    });

    //@id657
    it("Deploy custom ERC20 token to L1", async () => {
      deployedToken = await playbook.deployERC20toL1();
      expect(deployedToken).toContain(Logger.txHashStartsWith);
    });
  });
});

describe("Deposit", () => {
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = "src/playbook/";

  let result: string;
  let token: string;
  jest.setTimeout(localConfig.extendedTimeout);

  //@id633
  it("Make a deposit with 0.0000001 ETH ", async () => {
    result = await playbook.depositETH("0.0000001");
    await expect(result).not.toBeUndefined();
    await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
  });

  //@id638
  it("Make a deposit with the Custom token ", async () => {
    const bufferFile = bufferRoute + Buffer.L1;
    token = await helper.getStringFromFile(bufferFile);
    result = await playbook.depositERC20("100", token, 18);
    await expect(result).not.toBeUndefined();
    await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
  });
});
