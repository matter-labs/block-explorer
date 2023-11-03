import { Buffer } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

async function globalHook() {
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = "src/playbook/";
  const bufferFile = bufferRoute + Buffer.L1;
  const token = await helper.getStringFromFile(bufferFile);

  await playbook.deployERC20toL2();
  await playbook.deployERC20toL1();
  await playbook.depositETH("0.0000001");
  await playbook.depositERC20("100", token, 18);
}

globalHook()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
