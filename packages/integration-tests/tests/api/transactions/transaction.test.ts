import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "../../../src/config";
import { Buffer, Logger, Token, TransactionsStatus, TransactionsType, Wallets } from "../../../src/entities";
import { Helper } from "../../../src/helper";
import { Playbook } from "../../../src/playbook/playbook";

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

    //@id1452
    it("Verify transaction through Paymaster", async () => {
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
      const paymasterAddress = await helper.getStringFromFile(bufferRoute + Buffer.paymaster);

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymasterAddress })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: token })))
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(
            expect.objectContaining({
              token: {
                l2Address: token,
                l1Address: null,
                symbol: "MyToken",
                name: "MyToken",
                decimals: 18,
              },
            })
          )
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: paymasterAddress })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ token: null })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: paymasterAddress })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ token: null })));
    });
  });

  describe("Transaction with failed state", () => {
    beforeAll(async () => {
      const bufferFile = bufferRoute + Buffer.L2;
      token = await helper.getStringFromFile(bufferFile);
      txHash = await playbook.transferFailedState(token);
      return [txHash, token];
    });

    //@id645
    it("Verify the transactions with failed state", async () => {
      const apiRoute = `/transactions/${txHash}?page=1&limit=10`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.from).toStrictEqual(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.to).toStrictEqual(token))
        .expect((res) => expect(res.body.hash).toStrictEqual(txHash))
        .expect((res) => expect(res.body.status).toStrictEqual(TransactionsStatus.failed));
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

    //@id1454
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}", async () => {
      const apiRoute = `/transactions/${txHash}?page=1&limit=10`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ value: "0" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });

    //@id1455
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}/transfers", async () => {
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address }))
        )
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ token: null })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ token: null })));
    });
  });

  describe("Transactions for the /transactions endpoint", () => {
    jest.setTimeout(localConfig.extendedTimeout);

    //@id1506
    it("Verify the transaction via /transactions", async () => {
      contract = await helper.getStringFromFile(bufferRoute + Buffer.greeterL2);
      txHash = await helper.getStringFromFile(bufferRoute + Buffer.executeGreeterTx);

      const apiRoute = `/transactions`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
        .expect((res) => expect(res.body.items.length).toBe(10))
        .expect((res) => expect(typeof res.body.meta.totalItems).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.itemCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.itemsPerPage).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.totalPages).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.currentPage).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.links.first).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.links.previous).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.links.next).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.links.last).toStrictEqual("string"));
    });

    //@id1507
    it("Verify the transaction via /transactions/{transactionHash}/logs", async () => {
      contract = await helper.getStringFromFile(bufferRoute + Buffer.greeterL2);
      txHash = await helper.getStringFromFile(bufferRoute + Buffer.executeGreeterTx);

      const apiRoute = `/transactions/${txHash}/logs`;
      const decapitalizedAddress = apiRoute.slice(1).toLowerCase();

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ address: Token.ETHER_ERC20_Address }))
        )
        .expect((res) => expect(Array.isArray(res.body.items[0].topics)).toStrictEqual(true))
        .expect((res) => expect(typeof res.body.items[0].data).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.items[0].blockNumber).toStrictEqual("number"))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(typeof res.body.items[0].transactionIndex).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.items[0].logIndex).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.items[0].timestamp).toStrictEqual("string"))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ address: contract })))
        .expect((res) => expect(Array.isArray(res.body.items[1].topics)).toStrictEqual(true))
        .expect((res) => expect(typeof res.body.items[1].data).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.items[1].blockNumber).toStrictEqual("number"))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(typeof res.body.items[1].transactionIndex).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.items[1].logIndex).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.items[1].timestamp).toStrictEqual("string"))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ address: Token.ETHER_ERC20_Address }))
        )
        .expect((res) => expect(Array.isArray(res.body.items[2].topics)).toStrictEqual(true))
        .expect((res) => expect(typeof res.body.items[2].data).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.items[2].blockNumber).toStrictEqual("number"))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(typeof res.body.items[2].transactionIndex).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.items[2].logIndex).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.items[2].timestamp).toStrictEqual("string"))
        .expect((res) => expect(res.body.meta).toStrictEqual(expect.objectContaining({ totalItems: 3 })))
        .expect((res) => expect(res.body.meta).toStrictEqual(expect.objectContaining({ itemCount: 3 })))
        .expect((res) => expect(res.body.meta).toStrictEqual(expect.objectContaining({ itemsPerPage: 10 })))
        .expect((res) => expect(res.body.meta).toStrictEqual(expect.objectContaining({ totalPages: 1 })))
        .expect((res) => expect(res.body.meta).toStrictEqual(expect.objectContaining({ currentPage: 1 })))
        .expect((res) =>
          expect(res.body.links).toStrictEqual(expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` }))
        )
        .expect((res) => expect(res.body.links).toStrictEqual(expect.objectContaining({ previous: "" })))
        .expect((res) => expect(res.body.links).toStrictEqual(expect.objectContaining({ next: "" })))
        .expect((res) =>
          expect(res.body.links).toStrictEqual(
            expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
          )
        );
    });
  });
});
