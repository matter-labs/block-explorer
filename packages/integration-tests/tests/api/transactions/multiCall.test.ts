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

  //@id1464
  it("Verify the deployed Root contract via /address/{address}", async () => {
    await setTimeout(localConfig.standardPause); //works unstable without timeout
    contract = await helper.getStringFromFile(bufferRoute + Buffer.addressMultiCallRoot);
    txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallRoot);

    const apiRoute = `/address/${contract}`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ type: "contract" })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ address: contract })))
      .expect((res) =>
        expect(res.body).toStrictEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }))
      )
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ creatorTxHash: txHash })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ balances: {} })));
  });

  //@id1465
  it("Verify the deployed Middle contract via /address/{address}", async () => {
    await setTimeout(localConfig.standardPause); //works unstable without timeout
    contract = await helper.getStringFromFile(bufferRoute + Buffer.addressMultiCallMiddle);
    txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallMiddle);

    const apiRoute = `/address/${contract}`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ type: "contract" })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ address: contract })))
      .expect((res) =>
        expect(res.body).toStrictEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }))
      )
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ creatorTxHash: txHash })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ balances: {} })));
  });

  //@id1466
  it("Verify the deployed Caller contract via /address/{address}", async () => {
    await setTimeout(localConfig.standardPause); //works unstable without timeout
    contract = await helper.getStringFromFile(bufferRoute + Buffer.addressMultiCallCaller);
    txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallCaller);

    const apiRoute = `/address/${contract}`;

    return request(environment.blockExplorerAPI)
      .get(apiRoute)
      .expect(200)
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ type: "contract" })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ address: contract })))
      .expect((res) =>
        expect(res.body).toStrictEqual(expect.objectContaining({ creatorAddress: Wallets.richWalletAddress }))
      )
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ creatorTxHash: txHash })))
      .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ balances: {} })));
  });

  //@id690:I --> @id1467
  it("Use the multicall contracts", async () => {
    txMulticall = await playbook.useMultiCallContracts();
    expect(txMulticall).toContain(Logger.txHashStartsWith);
  });

  describe("Verify the multicall transactions via /transactions/${txHash}", () => {
    //@id1464:I --> @id1468
    it("Verify transaction for the Root contract via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallRoot);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ value: "0" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 })));
    });

    //@id1465:I --> @id1469
    it("Verify transaction for the Middle contract via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallMiddle);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ value: "0" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 })));
    });

    //@id1466:I --> @id1470
    it("Verify transaction for the Caller contract via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallCaller);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ value: "0" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 })));
    });

    //@id1471
    it("Verify transaction for the use multicall contract via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txUseMultiCallContracts);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ value: "0" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 })));
    });
  });

  describe("Verify the multicall transactions via /transactions/${txHash}/transfers", () => {
    //@id1472
    it("Verify transaction for the Root contract via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallRoot);
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ token: null })));
    });

    //@id1473
    it("Verify transaction for the Middle contract via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallMiddle);
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ token: null })));
    });

    //@id1474
    it("Verify transaction for the Caller contract via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiCallCaller);
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ token: null })));
    });

    //@id1475
    it("Verify transaction for the use multicall contract via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txUseMultiCallContracts);

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ token: null })));
    });
  });
});
