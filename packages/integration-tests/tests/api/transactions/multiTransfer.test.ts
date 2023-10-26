import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "../../../src/config";
import { Buffer, Logger, Token, TransactionsType, Wallets } from "../../../src/entities";
import { Helper } from "../../../src/helper";
import { Playbook } from "../../../src/playbook/playbook";

describe("Mulitransfer ETH", () => {
  jest.setTimeout(localConfig.extendedTimeout);
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = "src/playbook/";
  let txHash: string;
  let txMultiTransfer: string[];
  let token: string;
  let contract: string;

  beforeEach(async () => {
    contract = await helper.getStringFromFile(bufferRoute + Buffer.addressMultiTransferETH);
  });

  //@id690
  it("Deploy the multitransfer ETH contract to the L2", async () => {
    contract = await playbook.deployMultiTransferETH();
    expect(contract).toContain(Logger.txHashStartsWith);
  });

  //@id690 --> //@id1477
  it("Call the multitransfer contract to the L2", async () => {
    txMultiTransfer = await playbook.useMultiTransferETH();
    expect(txMultiTransfer[0]).toContain(Logger.txHashStartsWith);
    expect(txMultiTransfer[1]).toContain(Logger.txHashStartsWith);
    expect(txMultiTransfer[2]).toContain(Logger.txHashStartsWith);
  });
});
