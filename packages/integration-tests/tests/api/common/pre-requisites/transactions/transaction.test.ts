import { localConfig } from "../../../../../src/config";
import { Buffer, Logger } from "../../../../../src/entities";
import { Helper } from "../../../../../src/helper";
import { Playbook } from "../../../../../src/playbook/playbook";

describe("Transactions", () => {
  jest.setTimeout(localConfig.standardTimeout);
  const playbook = new Playbook();
  const helper = new Helper();
  const bufferRoute = "src/playbook/";
  let txHash: string;
  let token: string;
  let contract: string;
  let emptyWallet: string;

  describe("Paymaster", () => {
    jest.setTimeout(localConfig.extendedTimeout);

    beforeEach(async () => {
      token = await helper.getStringFromFile(bufferRoute + Buffer.customToken);
      txHash = await helper.getStringFromFile(bufferRoute + Buffer.paymasterTx);
      emptyWallet = await helper.getStringFromFile(bufferRoute + Buffer.emptyWalletAddress);
    });

    //@id1450
    it("Deploy contract via Paymaster", async () => {
      const result = await playbook.deployViaPaymaster();
      expect(result[0]).toContain(Logger.txHashStartsWith);
    });

    //@id644
    it("Transaction via Paymaster usage", async () => {
      const result = await playbook.usePaymaster();
      expect(result).toContain(Logger.txHashStartsWith);
    });
  });

  describe("Transaction with failed state", () => {
    beforeAll(async () => {
      const bufferFile = bufferRoute + Buffer.L2;
      token = await helper.getStringFromFile(bufferFile);
      txHash = await playbook.transferFailedState(token);
      return [txHash, token];
    });
  });

  describe("Greeter", () => {
    jest.setTimeout(localConfig.extendedTimeout);

    beforeEach(async () => {
      contract = await helper.getStringFromFile(bufferRoute + Buffer.greeterL2);
      txHash = await helper.getStringFromFile(bufferRoute + Buffer.executeGreeterTx);
    });

    //@id597
    it("Deploy the Greeter contract to the L2", async () => {
      contract = await playbook.deployGreeterToL2();
      expect(contract).toContain(Logger.txHashStartsWith);
    });

    //@id604
    it("Use the Greeter contract - execute SetGreeting", async () => {
      const executedContract = await playbook.useGreeter();
      expect(executedContract).toContain(Logger.txHashStartsWith);
    });
  });
});
