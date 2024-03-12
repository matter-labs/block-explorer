import { localConfig } from "../../src/config";
import { Buffer, Path, Token, TransactionStatus, TransactionsType, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Transactions", () => {
  jest.setTimeout(localConfig.extendedTimeout);

  const helper = new Helper();
  const playbook = new Playbook();
  let apiRoute: string;
  let contract: string;
  let token: string;
  let txHash: string;
  let response;

  beforeAll(async () => {
    const customToken = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
    await playbook.withdrawETHtoOtherAddress();
    await playbook.withdrawERC20(customToken);
    await playbook.withdrawERC20toOtherAddress(customToken);
    await playbook.withdrawETH();
    await playbook.deployMultiTransferETH();
    await playbook.useMultiTransferETH();
    await playbook.deployGreeterToL2();
    await playbook.useGreeter();
    await playbook.deployMultiCallContracts();
    await playbook.useMultiCallContracts();
  });

  describe("/transactions/{transactionHash}/transfers", () => {
    beforeAll(async () => {
      await playbook.transferETH("0.000001");
    });

    //@id1447
    it("Verify transfer ETH L2-L2 via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthTransfer);
        apiRoute = `/transactions/${txHash}/transfers`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1].from).toBe(Wallets.richWalletAddress);
        expect(response.body.items[1].to).toBe(Wallets.mainWalletAddress);
        expect(response.body.items[1].transactionHash).toBe(txHash);
        expect(response.body.items[1].amount).toBe("1000000000000");
        expect(response.body.items[1].type).toBe("transfer");
      });
    });

    //@id1459
    it("Verify the ETH withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdraw);
        apiRoute = `/transactions/${txHash}/transfers`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" }));
      });
    });

    //@id1461
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdrawOtherAddress);
        apiRoute = `/transactions/${txHash}/transfers`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.mainWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" }));
      });
    });

    //@id1463
    it("Verify the custom token withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        const customTokenL1 = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L1);
        const customTokenL2 = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txERC20WithdrawOtherAddress);
        apiRoute = `/transactions/${txHash}/transfers`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));

        expect(typeof response.body.items[1].amount).toStrictEqual("string");
        expect(typeof response.body.items[1].blockNumber).toStrictEqual("number");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[1].timestamp).toStrictEqual("string");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.addressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: customTokenL2 }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              usdPrice: null,
              iconURL: null,
              l1Address: customTokenL1,
              l2Address: customTokenL2,
              liquidity: null,
              symbol: "L1",
              name: "L1 ERC20 token",
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenType: "ERC20" }));

        expect(typeof response.body.items[2].amount).toStrictEqual("string");
        expect(typeof response.body.items[2].blockNumber).toStrictEqual("number");
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[2].timestamp).toStrictEqual("string");
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.mainWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ tokenAddress: customTokenL2 }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.withdrawal }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              usdPrice: null,
              iconURL: null,
              l1Address: customTokenL1,
              l2Address: customTokenL2,
              liquidity: null,
              symbol: "L1",
              name: "L1 ERC20 token",
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ tokenType: "ERC20" }));

        expect(typeof response.body.items[3].amount).toStrictEqual("string");
        expect(typeof response.body.items[3].blockNumber).toStrictEqual("number");
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[3].timestamp).toStrictEqual("string");
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[3]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalItems: 4 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemCount: 4 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemsPerPage: 10 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalPages: 1 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ currentPage: 1 }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` })
        );
        expect(response.body.links).toStrictEqual(expect.objectContaining({ previous: "" }));
        expect(response.body.links).toStrictEqual(expect.objectContaining({ next: "" }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
        );
      });
    });
  });

  describe("/transactions/{transactionHash}", () => {
    beforeAll(async () => {
      const customToken = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
      await playbook.transferFailedState(customToken);
    });

    //@id1460
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdrawOtherAddress);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.hash).toBe(txHash);
        expect(response.body.to).toBe("0x000000000000000000000000000000000000800A");
        expect(response.body.from).toBe(Wallets.richWalletAddress);
        expect(response.body.value).toBe("9000000000000");
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1462
    it("Verify the custom token withdrawal via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txERC20Withdraw);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.hash).toBe(txHash);
        expect(response.body.from).toBe(Wallets.richWalletAddress);
        expect(typeof response.body.to).toStrictEqual("string");
        expect(response.body.value).toBe("0");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1458
    it("Verify the ETH withdrawal via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdraw);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.hash).toBe(txHash);
        expect(response.body.to).toBe("0x000000000000000000000000000000000000800A");
        expect(response.body.from).toBe(Wallets.richWalletAddress);
        expect(response.body.value).toBe("9000000000000");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1478
    it("Verify transaction for the ETH via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferETH);
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body.value).toBe("101000000000000000");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1479
    it("Verify transaction for the Custom Token I via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenI);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body.value).toBe("0");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1480
    it("Verify transaction for the Custom Token II via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenII);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body.value).toBe("0");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1454
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.greeterL2);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.executeGreeterTx);
        apiRoute = `/transactions/${txHash}?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(typeof response.body.from).toStrictEqual("string");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1464:I --> @id1468
    it("Verify transaction for the Root contract via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallRoot);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ to: "0x0000000000000000000000000000000000008006" })
        );
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1465:I --> @id1469
    it("Verify transaction for the Middle contract via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallMiddle);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ to: "0x0000000000000000000000000000000000008006" })
        );
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1466:I --> @id1470
    it("Verify transaction for the Caller contract via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallCaller);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ to: "0x0000000000000000000000000000000000008006" })
        );
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id1471
    it("Verify transaction for the use multicall contract via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txUseMultiCallContracts);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.to).toStrictEqual("string");
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.status).toStrictEqual("string");
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });

    //@id645
    it("Verify the transactions with failed state via /transactions/{transactionHash}", async () => {
      await helper.runRetriableTestAction(async () => {
        token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.failedState);
        apiRoute = `/transactions/${txHash}?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.from).toStrictEqual(Wallets.richWalletAddress);
        expect(response.body.to).toStrictEqual(token);
        expect(response.body.hash).toStrictEqual(txHash);
        expect(response.body.status).toStrictEqual(TransactionStatus.failed);
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.data).toStrictEqual("string");
        expect(typeof response.body.fee).toStrictEqual("string");
        expect(typeof response.body.nonce).toStrictEqual("number");
        expect(typeof response.body.gasLimit).toStrictEqual("string");
        expect(typeof response.body.gasPrice).toStrictEqual("string");
        expect(typeof response.body.gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.blockNumber).toStrictEqual("number");
        expect(response.body.blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.l1BatchNumber).toStrictEqual("number");
        expect(response.body.l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.blockHash).toStrictEqual("string");
        expect(response.body.blockHash.length).toBe(66);
        expect(typeof response.body.type).toStrictEqual("number");
        expect(response.body.type).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.receivedAt).toStrictEqual("string");
        expect(response.body.receivedAt.length).toBe(24);
        expect(response.body).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ revertReason: "ERC20: transfer to the zero address" })
        );
        expect(typeof response.body.commitTxHash).toStrictEqual("string");
        expect(response.body.commitTxHash.length).toBe(66);
        expect(typeof response.body.executeTxHash).toStrictEqual("string");
        expect(response.body.executeTxHash.length).toBe(66);
        expect(typeof response.body.proveTxHash).toStrictEqual("string");
        expect(response.body.proveTxHash.length).toBe(66);
        expect(typeof response.body.isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.gasUsed).toStrictEqual("string");
      });
    });
  });

  describe("/transactions/{transactionHash}/transfers", () => {
    beforeAll(async () => {
      await playbook.deployViaPaymaster();
      await playbook.usePaymaster();
    });

    //@id1481
    it("Verify transaction for the ETH via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferETH);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1482
    it("Verify transaction for the Custom tokenI via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenI);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: token }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              l2Address: token,
              l1Address: null,
              symbol: "L2",
              name: "L2 ERC20 token",
              decimals: 18,
              iconURL: null,
              liquidity: null,
              usdPrice: null,
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1483
    it("Verify transaction for the Custom tokenII via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        const tokenL1 = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L1);
        token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2deposited);
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenII);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: token }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              l2Address: token,
              l1Address: tokenL1,
              symbol: "L1",
              name: "L1 ERC20 token",
              decimals: 18,
              iconURL: null,
              liquidity: null,
              usdPrice: null,
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1452
    it("Verify transaction through Paymaster via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        const paymasterAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymaster);
        const emptyWallet = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.emptyWalletAddress);
        token = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.customToken);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.paymasterTx);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymasterAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ amount: "1" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: token }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ERC20" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              l2Address: token,
              l1Address: null,
              symbol: "MyToken",
              name: "MyToken",
              decimals: 18,
              iconURL: null,
              liquidity: null,
              usdPrice: null,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: paymasterAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: paymasterAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1455
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.executeGreeterTx);
        apiRoute = `/transactions/${txHash}/transfers`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[1].amount).toStrictEqual("string");
        expect(typeof response.body.items[1].blockNumber).toStrictEqual("number");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[1].timestamp).toStrictEqual("string");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalItems: 2 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemCount: 2 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemsPerPage: 10 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalPages: 1 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ currentPage: 1 }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` })
        );
        expect(response.body.links).toStrictEqual(expect.objectContaining({ previous: "" }));
        expect(response.body.links).toStrictEqual(expect.objectContaining({ next: "" }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
        );
      });
    });

    //@id1472
    it("Verify transaction for the Root contract via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallRoot);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallRoot);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1473
    it("Verify transaction for the Middle contract via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallRoot);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallMiddle);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1474
    it("Verify transaction for the Caller contract via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiCallRoot);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiCallCaller);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });

    //@id1475
    it("Verify transaction for the use multicall contract via /transactions/{transactionHash}/transfers", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txUseMultiCallContracts);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.pullAddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenType: "ETH" }));
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.pullAddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ tokenAddress: Token.ERC20AddressETH }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.addressETH,
              l2Address: Token.ERC20AddressETH,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
      });
    });
  });

  describe("/transactions/${txHash}/logs", () => {
    //@id1507
    it("Verify the transaction via /transactions/{transactionHash}/logs", async () => {
      await helper.runRetriableTestAction(async () => {
        contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.greeterL2);
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.executeGreeterTx);
        apiRoute = `/transactions/${txHash}/logs`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ address: Token.ERC20AddressETH }));
        expect(Array.isArray(response.body.items[0].topics)).toStrictEqual(true);
        expect(typeof response.body.items[0].data).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[0].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[0].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ address: contract }));
        expect(Array.isArray(response.body.items[1].topics)).toStrictEqual(true);
        expect(typeof response.body.items[1].data).toStrictEqual("string");
        expect(typeof response.body.items[1].blockNumber).toStrictEqual("number");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[1].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[1].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[1].timestamp).toStrictEqual("string");
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ address: Token.ERC20AddressETH }));
        expect(Array.isArray(response.body.items[2].topics)).toStrictEqual(true);
        expect(typeof response.body.items[2].data).toStrictEqual("string");
        expect(typeof response.body.items[2].blockNumber).toStrictEqual("number");
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(typeof response.body.items[2].transactionIndex).toStrictEqual("number");
        expect(typeof response.body.items[2].logIndex).toStrictEqual("number");
        expect(typeof response.body.items[2].timestamp).toStrictEqual("string");
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalItems: 3 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemCount: 3 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ itemsPerPage: 10 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ totalPages: 1 }));
        expect(response.body.meta).toStrictEqual(expect.objectContaining({ currentPage: 1 }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ first: `${decapitalizedAddress}?limit=10` })
        );
        expect(response.body.links).toStrictEqual(expect.objectContaining({ previous: "" }));
        expect(response.body.links).toStrictEqual(expect.objectContaining({ next: "" }));
        expect(response.body.links).toStrictEqual(
          expect.objectContaining({ last: `${decapitalizedAddress}?page=1&limit=10` })
        );
      });
    });
  });

  describe("/transactions", () => {
    //@id1506
    it("Verify the transaction via /transactions", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/transactions`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toStrictEqual(true);
        expect(response.body.items.length).toBe(10);
        expect(typeof response.body.items[0].hash).toStrictEqual("string");
        expect(response.body.items[0].hash.length).toBe(66);
        expect(typeof response.body.items[0].to).toStrictEqual("string");
        expect(response.body.items[0].to.length).toBe(42);
        expect(typeof response.body.items[0].from).toStrictEqual("string");
        expect(response.body.items[0].from.length).toBe(42);
        expect(typeof response.body.items[0].data).toStrictEqual("string");
        expect(response.body.items[0].data.length).toBeGreaterThan(0);
        expect(typeof response.body.items[0].value).toStrictEqual("string");
        expect(response.body.items[0].value.length).toBeGreaterThanOrEqual(1);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(typeof response.body.items[0].fee).toStrictEqual("string");
        expect(response.body.items[0].fee.length).toBe(14);
        expect(typeof response.body.items[0].nonce).toStrictEqual("number");
        expect(response.body.items[0].nonce).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.items[0].gasLimit).toStrictEqual("string");
        expect(typeof response.body.items[0].gasPrice).toStrictEqual("string");
        expect(typeof response.body.items[0].gasPerPubdata).toStrictEqual("string");
        expect(typeof response.body.items[0].maxFeePerGas).toStrictEqual("string");
        expect(typeof response.body.items[0].maxPriorityFeePerGas).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0].blockNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.items[0].l1BatchNumber).toStrictEqual("number");
        expect(response.body.items[0].l1BatchNumber).toBeGreaterThanOrEqual(0);
        expect(typeof response.body.items[0].blockHash).toStrictEqual("string");
        expect(response.body.items[0].blockHash.length).toBe(66);
        expect(typeof response.body.items[0].type).toStrictEqual("number");
        expect(response.body.items[0].type).toBeGreaterThanOrEqual(0);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
        expect(typeof response.body.items[0].receivedAt).toStrictEqual("string");
        expect(response.body.items[0].receivedAt.length).toBe(24);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ error: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ revertReason: null }));
        expect(typeof response.body.items[0].status).toStrictEqual("string");
        expect(typeof response.body.items[0].commitTxHash).toStrictEqual("string");
        expect(response.body.items[0].commitTxHash.length).toBe(66);
        expect(typeof response.body.items[0].executeTxHash).toStrictEqual("string");
        expect(response.body.items[0].executeTxHash.length).toBe(66);
        expect(typeof response.body.items[0].proveTxHash).toStrictEqual("string");
        expect(response.body.items[0].proveTxHash.length).toBe(66);
        expect(typeof response.body.items[0].isL1BatchSealed).toStrictEqual("boolean");
        expect(typeof response.body.meta.totalItems).toStrictEqual("number");
        expect(typeof response.body.meta.itemCount).toStrictEqual("number");
        expect(typeof response.body.meta.itemsPerPage).toStrictEqual("number");
        expect(typeof response.body.meta.totalPages).toStrictEqual("number");
        expect(typeof response.body.meta.currentPage).toStrictEqual("number");
        expect(typeof response.body.links.first).toStrictEqual("string");
        expect(typeof response.body.links.previous).toStrictEqual("string");
        expect(typeof response.body.links.next).toStrictEqual("string");
        expect(typeof response.body.links.last).toStrictEqual("string");
      });
    });
  });

  describe("/api?module=transaction", () => {
    //@id1697
    it("Verify /api?module=transaction&action=getstatus response", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthTransfer);
        apiRoute = `/api?module=transaction&action=getstatus&txhash=${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result).toStrictEqual(expect.objectContaining({ isError: "0", errDescription: "" }));
      });
    });

    //@id1698
    it("Verify /api?module=transaction&action=gettxreceiptstatus response", async () => {
      await helper.runRetriableTestAction(async () => {
        txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthTransfer);
        apiRoute = `/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result.status).toStrictEqual("string");
      });
    });
  });
});
