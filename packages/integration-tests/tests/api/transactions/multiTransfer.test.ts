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

  describe("Verify the multitransfer transactions via /transactions/${txHash}", () => {
    //@id1478
    it("Verify transaction for the ETH via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiTransferETH);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });

    //@id1479
    it("Verify transaction for the Custom Token I via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiTransferCustomTokenI);
      contract = await helper.getStringFromFile(bufferRoute + Buffer.L2);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });

    //@id1480
    it("Verify transaction for the Custom Token II via /transactions/${txHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiTransferCustomTokenII);
      contract = await helper.getStringFromFile(bufferRoute + Buffer.L2deposited);
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });
  });

  describe("Verify the multitransfer transactions via /transactions/${txHash}/transfer", () => {
    beforeAll(async () => {
      token = await helper.getStringFromFile(bufferRoute + Buffer.L2);
    });

    //@id1481
    it("Verify transaction for the ETH via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiTransferETH);
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
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ token: null })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
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

    //@id1482
    it("Verify transaction for the Custom tokenI via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      contract = await helper.getStringFromFile(bufferRoute + Buffer.addressMultiTransferETH);
      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiTransferCustomTokenI);
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
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: token })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(
            expect.objectContaining({
              token: {
                l2Address: token,
                l1Address: null,
                symbol: "L2",
                name: "L2 ERC20 token",
                decimals: 18,
              },
            })
          )
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
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

    //@id1483
    it("Verify transaction for the Custom tokenII via /transactions/${txHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      const tokenL1 = await helper.getStringFromFile(bufferRoute + Buffer.L1);
      token = await helper.getStringFromFile(bufferRoute + Buffer.L2deposited);
      txHash = await helper.getStringFromFile(bufferRoute + Buffer.txMultiTransferCustomTokenII);
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;

      return (
        request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) =>
            expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
          )
          .expect((res) =>
            expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
          )
          .expect((res) =>
            expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }))
          )
          .expect((res) =>
            expect(res.body.items[0]).toStrictEqual(
              expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
            )
          )
          .expect((res) =>
            expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }))
          )
          .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null })))
          .expect((res) =>
            expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
          )
          .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract })))
          .expect((res) =>
            expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }))
          )
          // .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })))
          .expect((res) =>
            expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }))
          )
          .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null })))
          .expect((res) =>
            expect(res.body.items[1]).toStrictEqual(
              expect.objectContaining({
                token: {
                  l2Address: token,
                  l1Address: tokenL1,
                  symbol: "L1",
                  name: "L1 ERC20 token",
                  decimals: 18,
                },
              })
            )
          )
          .expect((res) =>
            expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
          )
          .expect((res) =>
            expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
          )
          .expect((res) =>
            expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }))
          )
          .expect((res) =>
            expect(res.body.items[2]).toStrictEqual(
              expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
            )
          )
          .expect((res) =>
            expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }))
          )
          .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null })))
          .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ token: null })))
      );
    });
  });
});
