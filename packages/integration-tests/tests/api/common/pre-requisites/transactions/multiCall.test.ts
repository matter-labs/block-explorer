import { localConfig } from "../../../../../src/config";
import { Logger } from "../../../../../src/entities";
import { Playbook } from "../../../../../src/playbook/playbook";

describe("Multicall transactions", () => {
  jest.setTimeout(localConfig.extendedTimeout);
  const playbook = new Playbook();
  let txMulticall: string;

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
