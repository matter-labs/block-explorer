import { Buffer } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async () => {
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = "src/playbook/";

  await playbook.deployERC20toL2();
  await sleep(2000);
  await playbook.deployERC20toL1();
  await sleep(2000);
  await playbook.depositETH("0.0000001");
  await sleep(2000);
  const bufferFile = bufferRoute + Buffer.L1;
  const token = await helper.getStringFromFile(bufferFile);
  await playbook.depositERC20("100", token, 18);
};
