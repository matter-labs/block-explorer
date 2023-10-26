import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "../../../src/config";
import { Buffer, Logger, Token, TransactionsType, Wallets } from "../../../src/entities";
import { Helper } from "../../../src/helper";
import { Playbook } from "../../../src/playbook/playbook";

describe("Multicall transactions", () => {
  jest.setTimeout(localConfig.extendedTimeout);
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = "src/playbook/";
  let txHash: string;
  let txMulticall: string;
  let contract: string;

  //@id689
  it("Deploy the Multicall contracts", async () => {
    const contract: string[] = await playbook.deployMultiCallContracts();
    expect(contract[0]).toContain(Logger.txHashStartsWith);
    expect(contract[1]).toContain(Logger.txHashStartsWith);
    expect(contract[2]).toContain(Logger.txHashStartsWith);
  });

  //@id690:I --> @id1467
  it("Use the multicall contracts", async () => {
    txMulticall = await playbook.useMultiCallContracts();
    expect(txMulticall).toContain(Logger.txHashStartsWith);
  });
});
