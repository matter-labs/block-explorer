import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../../src/config";
import { localConfig } from "../../../src/config";
import { Buffer, Wallets } from "../../../src/entities";
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

  //@id1447
  it("Verify transfer ETH L2-L2 via /transactions/{transactionHash}/transfers", async () => {
    const apiRoute = `/transactions/${txHashEth}/transfers`;
    await setTimeout(localConfig.standardPause);

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body.items[1].from).toBe(Wallets.richWalletAddress))
      .expect((res) => expect(res.body.items[1].to).toBe(Wallets.mainWalletAddress))
      .expect((res) => expect(res.body.items[1].transactionHash).toBe(txHashEth))
      .expect((res) => expect(res.body.items[1].amount).toBe("1000000000000"))
      .expect((res) => expect(res.body.items[1].type).toBe("transfer"));
  });
});
