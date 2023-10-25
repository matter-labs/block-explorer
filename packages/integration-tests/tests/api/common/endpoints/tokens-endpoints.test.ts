import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../../../src/config";
import { localConfig } from "../../../../src/config";
import { Buffer, Token, TransactionsType, Wallets } from "../../../../src/entities";
import { Helper } from "../../../../src/helper";
import { Playbook } from "../../../../src/playbook/playbook";

describe("Tokens", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  const bufferFile = "src/playbook/";
  let l2Token: string;
  let txHash: string;

  beforeAll(async () => {
    l2Token = await helper.getStringFromFile(bufferFile + Buffer.L2);
  });

  describe("/tokens", () => {
    //@id1508
    it("Verify the response via /tokens", async () => {
      const l2DepositedToken = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
      const l1Token = await helper.getStringFromFile(bufferFile + Buffer.L1);
      const apiRoute = `/tokens`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ l2Address: l2DepositedToken }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ l1Address: l1Token })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ symbol: "L1" })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ name: "L1 ERC20 token" })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ decimals: 18 })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ l2Address: l2Token })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ l1Address: null })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ symbol: "L2" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ name: "L2 ERC20 token" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ decimals: 18 })))
        .expect((res) => expect(typeof res.body.meta.totalItems).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.itemCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.itemsPerPage).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.totalPages).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.meta.currentPage).toStrictEqual("number"))
        .expect((res) => expect(res.body.links.first).toStrictEqual("tokens?limit=10"))
        .expect((res) => expect(res.body.links.previous).toStrictEqual(""))
        .expect((res) => expect(typeof res.body.links.next).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.links.last).toStrictEqual("string"));
    });
  });
  describe("/tokens/{tokenAddress}", () => {
    //@id1456
    it("Verify deployed to L2 custom token via /tokens/{tokenAddress}", async () => {
      const apiRoute = `/tokens/${l2Token}`;

      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            l2Address: l2Token,
            l1Address: null,
            symbol: Token.customL2TokenSymbol,
            name: Token.customL2TokenName,
            decimals: Token.customL2TokenDecimals,
          })
        );
    });
  });
  describe("/tokens/{address}/transfers", () => {
    //@id1448
    it("Verify the custom ERC20 token transfer via /tokens/{address}/transfers", async () => {
      const apiRoute = `/tokens/${l2Token}/transfers?page=1&limit=10`;
      const txHash = await playbook.transferERC20("0.01", l2Token, "L2");

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.items[0].amount).toBe("10000000000000000"))
        .expect((res) => expect(res.body.items[0].from).toBe(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.items[0].to).toBe(Wallets.secondWalletAddress))
        .expect((res) => expect(res.body.items[0].token).toEqual(expect.objectContaining({ l2Address: l2Token })))
        .expect((res) => expect(res.body.items[0]).toEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[0]).toEqual(expect.objectContaining({ type: "transfer" })));
    });

    //@id1451
    it("Verify the custom token includes paymaster transaction", async () => {
      l2Token = await helper.getStringFromFile(bufferFile + Buffer.customToken);
      const emptyWallet = await helper.getStringFromFile(bufferFile + Buffer.emptyWalletAddress);
      const paymaster = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
      txHash = await helper.getStringFromFile(bufferFile + Buffer.paymasterTx);

      const apiRoute = `/tokens/${l2Token}/transfers?page=1&limit=10`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymaster })))
        .expect((res) => expect(res.body.items[0].token).toStrictEqual(expect.objectContaining({ l2Address: l2Token })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }))
        );
    });
  });
});
