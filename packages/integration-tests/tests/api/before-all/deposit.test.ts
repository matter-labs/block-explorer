import { localConfig } from "../../../src/config";
import { Buffer } from "../../../src/entities";
import { Logger } from "../../../src/entities";
import { Helper } from "../../../src/helper";
import { Playbook } from "../../../src/playbook/playbook";

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
