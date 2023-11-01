import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Buffer, Token, TransactionsStatus, TransactionsType, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Transactions", () => {
  jest.setTimeout(localConfig.extendedTimeout);

  const helper = new Helper();
  const bufferFile = "src/playbook/";
  const playbook = new Playbook();

  let contract: any;
  let token: string;
  let txHash: any;

  describe("/transactions/{transactionHash}/transfers", () => {
    //@id1447
    it("Verify transfer ETH L2-L2 via /transactions/{transactionHash}/transfers", async () => {
      txHash = await playbook.transferETH("0.000001");
      const apiRoute = `/transactions/${txHash}/transfers`;
      await setTimeout(localConfig.standardPause);

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.items[1].from).toBe(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.items[1].to).toBe(Wallets.mainWalletAddress))
        .expect((res) => expect(res.body.items[1].transactionHash).toBe(txHash))
        .expect((res) => expect(res.body.items[1].amount).toBe("1000000000000"))
        .expect((res) => expect(res.body.items[1].type).toBe("transfer"));
    });

    //@id1459
    it("Verify the ETH withdrawal via /transactions/{transactionHash}/transfers", async () => {
      txHash = await playbook.withdrawETH();

      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${txHash}/transfers`;

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_ERC20_Address }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" })))
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });

    //@id1461
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}/transfers", async () => {
      txHash = await playbook.withdrawETHtoOtherAddress();

      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${txHash}/transfers`;

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_ERC20_Address }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.mainWalletAddress }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" })))
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });

    //@id1463
    it("Verify the custom token withdrawal via /transactions/{transactionHash}/transfers", async () => {
      token = bufferFile + "/" + Buffer.L2deposited;
      const l1Token = bufferFile + "/" + Buffer.L1;
      const customTokenL2 = await helper.getStringFromFile(token);
      const customTokenL1 = await helper.getStringFromFile(l1Token);
      txHash = await playbook.withdrawERC20(customTokenL2);
      const apiRoute = `/transactions/${txHash}/transfers`;

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
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_Address })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "200000000000000000" }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(
            expect.objectContaining({
              token: {
                l2Address: customTokenL2,
                l1Address: customTokenL1,
                symbol: "L1",
                name: "L1 ERC20 token",
                decimals: 18,
              },
            })
          )
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ amount: "200000000000000000" }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(
            expect.objectContaining({
              token: {
                l2Address: customTokenL2,
                l1Address: customTokenL1,
                symbol: "L1",
                name: "L1 ERC20 token",
                decimals: 18,
              },
            })
          )
        )
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: txHash })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });
  });

  describe("/transactions/{transactionHash}", () => {
    //@id1460
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}", async () => {
      txHash = await playbook.withdrawETHtoOtherAddress();
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(txHash))
        .expect((res) => expect(res.body.to).toBe("0x000000000000000000000000000000000000800A"))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.value).toBe("9000000000000"));
    });

    //@id1462
    it("Verify the custom token withdrawal via /transactions/{transactionHash}", async () => {
      token = bufferFile + "/" + Buffer.L2deposited;
      const customToken = await helper.getStringFromFile(token);
      txHash = await playbook.withdrawERC20(customToken);
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      const apiRoute = `/transactions/${txHash}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(txHash))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress));
    });

    //@id1458
    it("Verify the ETH withdrawal via /transactions/{transactionHash}", async () => {
      txHash = await playbook.withdrawETH();
      const apiRoute = `/transactions/${txHash}`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(txHash))
        .expect((res) => expect(res.body.to).toBe("0x000000000000000000000000000000000000800A"))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.value).toBe("9000000000000"));
    });

    //@id1478
    it("Verify transaction for the ETH via /transactions/{transactionHash}", async () => {
      // txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiTransferETH);
      contract = await playbook.deployMultiTransferETH();
      txHash = await playbook.useMultiTransferETH();
      const apiRoute = `/transactions/${txHash[0]}`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash[0] })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });

    //@id1479
    it("Verify transaction for the Custom Token I via /transactions/{transactionHash}", async () => {
      contract = await playbook.deployERC20toL2();
      txHash = await playbook.useMultiTransferETH();
      const apiRoute = `/transactions/${txHash[1]}`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash[1] })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });

    //@id1480
    it("Verify transaction for the Custom Token II via /transactions/{transactionHash}", async () => {
      token = await playbook.deployERC20toL1();
      await setTimeout(0.9 * 1000);
      await playbook.depositERC20("100", token, 18);
      await setTimeout(0.9 * 1000);
      contract = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
      txHash = await playbook.useMultiTransferETH();
      txHash = txHash[2];
      const apiRoute = `/transactions/${txHash}`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ to: contract })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })));
    });

    //@id1454
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}", async () => {
      contract = await playbook.deployGreeterToL2();
      txHash = await playbook.useGreeter();
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

    //@id1464:I --> @id1468
    it("Verify transaction for the Root contract via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      await playbook.deployMultiCallContracts();
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallRoot);
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
    it("Verify transaction for the Middle contract via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      await playbook.deployMultiCallContracts();
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallMiddle);

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
    it("Verify transaction for the Caller contract via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      await playbook.deployMultiCallContracts();
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallCaller);

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
    it("Verify transaction for the use multicall contract via /transactions/{transactionHash}", async () => {
      await playbook.deployMultiCallContracts();
      await playbook.useMultiCallContracts();

      txHash = await helper.getStringFromFile(bufferFile + Buffer.txUseMultiCallContracts);
      const apiRoute = `/transactions/${txHash}`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ hash: txHash })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ value: "0" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ isL1Originated: false })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ transactionIndex: 0 })));
    });

    //@id645
    it("Verify the transactions with failed state via /transactions/{transactionHash}", async () => {
      token = await playbook.deployERC20toL2();
      txHash = await playbook.transferFailedState(token);

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

  describe("/transactions/${txHash}/transfers", () => {
    //@id1481
    it("Verify transaction for the ETH via /transactions/{transactionHash}/transfers", async () => {
      contract = await playbook.deployMultiTransferETH();
      txHash = await playbook.useMultiTransferETH();
      txHash = txHash[0];
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
    it("Verify transaction for the Custom tokenI via /transactions/{transactionHash}/transfers", async () => {
      token = await playbook.deployERC20toL2();
      contract = await playbook.deployMultiTransferETH();
      txHash = await playbook.useMultiTransferETH();
      txHash = txHash[1];
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
    it("Verify transaction for the Custom tokenII via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      const tokenL1 = await playbook.deployERC20toL1();
      await setTimeout(0.9 * 1000);
      await playbook.depositERC20("100", tokenL1, 18);
      await setTimeout(0.9 * 1000);
      token = await helper.getStringFromFile(bufferFile + Buffer.L2deposited);
      contract = await playbook.deployMultiTransferETH();
      await setTimeout(0.9 * 1000);
      txHash = await playbook.useMultiTransferETH();
      txHash = txHash[2];

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

    //@id1452
    it("Verify transaction through Paymaster via /transactions/{transactionHash}/transfers", async () => {
      // const paymasterAddress = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
      await playbook.deployViaPaymaster();
      const paymasterAddress = await helper.getStringFromFile(bufferFile + Buffer.paymaster);
      const emptyWallet = await helper.getStringFromFile(bufferFile + Buffer.emptyWalletAddress);
      token = await helper.getStringFromFile(bufferFile + Buffer.customToken);
      txHash = await playbook.usePaymaster();
      const apiRoute = `/transactions/${txHash}/transfers?page=1&limit=10`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: emptyWallet })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: paymasterAddress })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ amount: "1" })))
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

    //@id1455
    it("Verify the transaction after SetGreeting execution via transactions/{transactionHash}/transfers", async () => {
      await playbook.deployGreeterToL2();
      txHash = await playbook.useGreeter();

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

    //@id1472
    it("Verify transaction for the Root contract via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      contract = await playbook.deployMultiCallContracts();
      contract = contract[0];
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallRoot);

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
    it("Verify transaction for the Middle contract via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      contract = await playbook.deployMultiCallContracts();
      contract = contract[1];
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallMiddle);

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
    it("Verify transaction for the Caller contract via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      contract = await playbook.deployMultiCallContracts();
      contract = contract[2];
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txMultiCallMiddle);

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
    it("Verify transaction for the use multicall contract via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout

      await playbook.deployMultiCallContracts();
      await playbook.useMultiCallContracts();
      txHash = await helper.getStringFromFile(bufferFile + Buffer.txUseMultiCallContracts);

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

  //@id1507
  it("Verify the transaction via /transactions/{transactionHash}/logs", async () => {
    contract = await playbook.deployGreeterToL2();
    txHash = await playbook.useGreeter();

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

  //@id1506
  it("Verify the transaction via /transactions", async () => {
    contract = await playbook.deployGreeterToL2();
    txHash = await playbook.useGreeter();

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
});
