import * as path from "path";

import { Buffer } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

export default async () => {
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = path.join("src", "playbook");

  // await playbook.compileContracts();
  await playbook.deployERC20toL2();
  await playbook.deployERC20toL1();
  await playbook.depositETH("0.0000001");
  const bufferFile = path.join(bufferRoute, Buffer.L1);
  const token = await helper.getStringFromFile(bufferFile);
  await playbook.depositERC20("100", token, 18);
  console.log("Final step in global == == ==");
};
