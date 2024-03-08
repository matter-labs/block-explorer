import { Buffer, Path } from "../../src/constants";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

export default async () => {
  const playbook = new Playbook();
  const helper = new Helper();

  await playbook.deployERC20toL2();
  await playbook.deployERC20toL1();
  await playbook.depositETH("0.0000001");
  const token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L1);
  await playbook.depositERC20("100", token, 18);
};
