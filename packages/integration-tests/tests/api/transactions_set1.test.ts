import { localConfig } from "../../src/config";
import { Buffer, Token, TransactionsStatus, TransactionsType, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Transactions", () => {
  jest.setTimeout(localConfig.extendedTimeout);

  const helper = new Helper();
  const bufferFile = "src/playbook/";
  const playbook = new Playbook();
  let apiRoute: string;
  let contract: string;
  let token: string;
  let txHash: string;
  let response;

  beforeAll(async () => {
    const customToken = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
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
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthTransfer);
        apiRoute = `/transactions/${txHash}/transfers`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[1].from).toBe(Wallets.richWalletAddress);
        expect(response.body.items[1].to).toBe(Wallets.mainWalletAddress);
        expect(response.body.items[1].transactionHash).toBe(txHash);
        expect(response.body.items[1].amount).toBe("1000000000000");
        expect(response.body.items[1].type).toBe("transfer");
      });
    });

    //@id1459
    it("Verify the ETH withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthWithdraw);
        apiRoute = `/transactions/${txHash}/transfers`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_ERC20_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" }));
      });
    });

    //@id1461
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}/transfers", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthWithdrawOtherAddress);
        apiRoute = `/transactions/${txHash}/transfers`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_ERC20_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.mainWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" }));
      });
    });

    //@id1463
    it("Verify the custom token withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await helper.retryTestAction(async () => {
        const l1Token = bufferFile + "/" + Buffer.L1;
        const customTokenL1 = await helper.getStringFromFile(l1Token);
        const l2Token = bufferFile + "/" + Buffer.L2deposited;
        const customTokenL2 = await helper.getStringFromFile(l2Token);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txERC20WithdrawOtherAddress);
        apiRoute = `/transactions/${txHash}/transfers`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_Address }));
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
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[3].timestamp).toStrictEqual("string");
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[3]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[3]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[3]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      const customToken = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
      await playbook.transferFailedState(customToken);
    });

    //@id1460
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthWithdrawOtherAddress);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.hash).toBe(txHash);
        expect(response.body.to).toBe("0x000000000000000000000000000000000000800A");
        expect(response.body.from).toBe(Wallets.richWalletAddress);
        expect(response.body.value).toBe("9000000000000");
      });
    });

    //@id1462
    it("Verify the custom token withdrawal via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txERC20Withdraw);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.hash).toBe(txHash);
        expect(response.body.from).toBe(Wallets.richWalletAddress);
      });
    });

    //@id1458
    it("Verify the ETH withdrawal via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txEthWithdraw);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.hash).toBe(txHash);
        expect(response.body.to).toBe("0x000000000000000000000000000000000000800A");
        expect(response.body.from).toBe(Wallets.richWalletAddress);
        expect(response.body.value).toBe("9000000000000");
      });
    });

    //@id1478
    it("Verify transaction for the ETH via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferETH);
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiTransferETH);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
      });
    });

    //@id1479
    it("Verify transaction for the Custom Token I via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.L2);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferCustomTokenI);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        // expect(response.body).toStrictEqual(expect.objectContaining({ to: contract })) //unstable on CI
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
      });
    });

    //@id1480
    it("Verify transaction for the Custom Token II via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferCustomTokenII);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
      });
    });

    //@id1454
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.greeterL2);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.executeGreeterTx);
        apiRoute = `/transactions/${txHash}?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ to: contract }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
      });
    });

    //@id1464:I --> @id1468
    it("Verify transaction for the Root contract via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallRoot);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
      });
    });

    //@id1465:I --> @id1469
    it("Verify transaction for the Middle contract via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallMiddle);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
      });
    });

    //@id1466:I --> @id1470
    it("Verify transaction for the Caller contract via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallCaller);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
      });
    });

    //@id1471
    it("Verify transaction for the use multicall contract via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txUseMultiCallContracts);
        apiRoute = `/transactions/${txHash}`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body).toStrictEqual(expect.objectContaining({ value: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ isL1Originated: false }));
        expect(response.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 }));
      });
    });

    //@id645
    it("Verify the transactions with failed state via /transactions/{transactionHash}", async () => {
      await helper.retryTestAction(async () => {
        token = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.failedState);
        apiRoute = `/transactions/${txHash}?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.from).toStrictEqual(Wallets.richWalletAddress);
        expect(response.body.to).toStrictEqual(token);
        expect(response.body.hash).toStrictEqual(txHash);
        expect(response.body.status).toStrictEqual(TransactionsStatus.failed);
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
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiTransferETH);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferETH);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        token = await helper.getStringFromFile(bufferFile + Buffer.L2);
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiTransferETH);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferCustomTokenI);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
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
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        const tokenL1 = await helper.getStringFromFile(bufferFile + Buffer.L1);
        token = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiTransferETH);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferCustomTokenII);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
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
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        const paymasterAddress = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
        const emptyWallet = await helper.getStringFromFile(bufferFile + Buffer.emptyWalletAddress);
        token = await helper.getStringFromFile(bufferFile + Buffer.customToken);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.paymasterTx);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymasterAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ amount: "1" }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ tokenAddress: token }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.transfer }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
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
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ to: paymasterAddress }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[2]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[2]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.executeGreeterTx);
        apiRoute = `/transactions/${txHash}/transfers`;
        const decapitalizedAddress = apiRoute.slice(1).toLowerCase();
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(typeof response.body.items[0].amount).toStrictEqual("string");
        expect(typeof response.body.items[0].blockNumber).toStrictEqual("number");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[0].timestamp).toStrictEqual("string");
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ isInternal: false }));
        expect(typeof response.body.items[1].timestamp).toStrictEqual("string");
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallRoot);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallRoot);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallRoot);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallMiddle);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        contract = await helper.getStringFromFile(bufferFile + Buffer.addressMultiCallRoot);
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallCaller);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
      await helper.retryTestAction(async () => {
        txHash = await helper.getStringFromFile(bufferFile + Buffer.txUseMultiCallContracts);
        apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;
        response = await helper.performGETrequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ type: TransactionsType.fee }));
        expect(response.body.items[0]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[0]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
              liquidity: 220000000000,
              symbol: "ETH",
              name: "Ether",
              usdPrice: 1800,
            },
          })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({ tokenAddress: Token.ETHER_ERC20_Address })
        );
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ type: TransactionsType.refund }));
        expect(response.body.items[1]).toStrictEqual(expect.objectContaining({ fields: null }));
        expect(response.body.items[1]).toStrictEqual(
          expect.objectContaining({
            token: {
              decimals: 18,
              iconURL: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266",
              l1Address: Token.ETHER_Address,
              l2Address: Token.ETHER_ERC20_Address,
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
});
