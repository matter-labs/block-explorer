import { localConfig } from "../../../src/config";
import { Buffer } from "../../../src/entities";
import { Helper } from "../../../src/helper";
import { Playbook } from "../../../src/playbook/playbook";

describe("Transfer", () => {
  jest.setTimeout(localConfig.standardTimeout);
  const helper = new Helper();
  const playbook = new Playbook();
  const bufferFile = "src/playbook/" + Buffer.L2;
  let txHashEth: string;
  let txHashCust: string;
  let token: string;

  beforeAll(async () => {
    token = await helper.getStringFromFile(bufferFile);
    txHashEth = await playbook.transferETH("0.000001");
    txHashCust = await playbook.transferERC20("0.01", token, "L2");

    return [txHashCust, txHashEth];
  });
});
