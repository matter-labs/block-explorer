import { localConfig } from "../../src/config";
import { Buffer, Path, Token, TransactionsType, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Tokens", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  let apiRoute: string;
  let l2Token: string;
  let txHash: string;
  let response;

  beforeAll(async () => {
    l2Token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
  });

  describe("/tokens", () => {
    //@id1508
    it("Verify the response via /tokens", async () => {
      await helper.runRetriableTestAction(async () => {
        const l2DepositedToken = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
        const l1Token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L1);
        apiRoute = `/tokens`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toStrictEqual(true);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ l2Address: l2DepositedToken }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ l1Address: l1Token }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ symbol: "L1" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ name: "L1 ERC20 token" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ decimals: 18 }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ l2Address: l2Token }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ l1Address: null }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ symbol: "L2" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ name: "L2 ERC20 token" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ decimals: 18 }));
        expect(typeof response.body.meta.totalItems).toStrictEqual("number");
        expect(typeof response.body.meta.itemCount).toStrictEqual("number");
        expect(typeof response.body.meta.itemsPerPage).toStrictEqual("number");
        expect(typeof response.body.meta.totalPages).toStrictEqual("number");
        expect(typeof response.body.meta.currentPage).toStrictEqual("number");
        expect(response.body.links.first).toStrictEqual("tokens?limit=10");
        expect(response.body.links.previous).toStrictEqual("");
        expect(typeof response.body.links.next).toStrictEqual("string");
        expect(typeof response.body.links.last).toStrictEqual("string");
      });
    });

    //@id1456
    it("Verify deployed to L2 custom token via /tokens/{tokenAddress}", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/tokens/${l2Token}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          l2Address: l2Token,
          l1Address: null,
          liquidity: null,
          usdPrice: null,
          iconURL: null,
          symbol: Token.customL2TokenSymbol,
          name: Token.customL2TokenName,
          decimals: Token.customL2TokenDecimals,
        });
      });
    });

    describe("/tokens/{address}/transfers", () => {
      beforeAll(async () => {
        txHash = await playbook.transferERC20("0.01", l2Token, "L2");
        await playbook.deployViaPaymaster();
        await playbook.usePaymaster();
      });

      //@id1448
      it("Verify the custom ERC20 token transfer via /tokens/{address}/transfers", async () => {
        await helper.runRetriableTestAction(async () => {
          apiRoute = `/tokens/${l2Token}/transfers?page=1&limit=10`;
          response = await helper.performBlockExplorerApiGetRequest(apiRoute);

          expect(response.status).toBe(200);
          expect(response.body.items[0].amount).toBe("10000000000000000");
          expect(response.body.items[0].from).toBe(Wallets.richWalletAddress);
          expect(response.body.items[0].to).toBe(Wallets.secondaryWalletAddress);
          expect(response.body.items[0].token).toEqual(expect.objectContaining({ l2Address: l2Token }));
          expect(response.body.items[0]).toEqual(expect.objectContaining({ transactionHash: txHash }));
          expect(response.body.items[0]).toEqual(expect.objectContaining({ type: "transfer" }));
        });
      });

      //@id1451
      it("Verify the custom token includes paymaster transaction via /tokens/{address}/transfers", async () => {
        await helper.runRetriableTestAction(async () => {
          l2Token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.customToken);
          const emptyWallet = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.emptyWalletAddress);
          const paymaster = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymaster);
          txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymasterTx);
          apiRoute = `/tokens/${l2Token}/transfers?page=1&limit=10`;
          response = await helper.performBlockExplorerApiGetRequest(apiRoute);

          expect(response.status).toBe(200);
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymaster }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ l2Address: l2Token }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        });
      });

      //id1803
      it("Verify the response via /tokens/{address}/transfers", async () => {
        await helper.runRetriableTestAction(async () => {
          l2Token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.customToken);
          const emptyWallet = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.emptyWalletAddress);
          const paymaster = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymaster);
          txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymasterTx);
          const apiRoute = `/tokens/${l2Token}/transfers?page=1&limit=10`;
          const decapitalizedTokenAddress = l2Token.toLowerCase();
          response = await helper.performBlockExplorerApiGetRequest(apiRoute);

          expect(response.status).toBe(200);
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymaster }));
          expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
          expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ amount: "1" }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: l2Token }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ERC20" }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
          expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ l2Address: l2Token }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ l1Address: null }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ symbol: "MyToken" }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ name: "MyToken" }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ decimals: 18 }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ usdPrice: null }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ liquidity: null }));
          expect(response.body.items[0].token).toStrictEqual(expect.objectContaining({ iconURL: null }));
          expect(typeof response.body.meta.totalItems).toStrictEqual("number");
          expect(typeof response.body.meta.itemCount).toStrictEqual("number");
          expect(typeof response.body.meta.itemsPerPage).toStrictEqual("number");
          expect(typeof response.body.meta.totalPages).toStrictEqual("number");
          expect(typeof response.body.meta.currentPage).toStrictEqual("number");
          expect(response.body.links.first).toStrictEqual(`tokens/${decapitalizedTokenAddress}/transfers?limit=10`);
          expect(response.body.links.previous).toStrictEqual("");
          expect(response.body.links.next).toStrictEqual("");
          expect(response.body.links.last).toStrictEqual(
            `tokens/${decapitalizedTokenAddress}/transfers?page=1&limit=10`
          );
        });
      });
    });
  });
});
