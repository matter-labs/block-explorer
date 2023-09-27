import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "../../src/config";
import { Buffer, Token, Wallets } from "../../src/entities";
import { Logger } from "../../src/entities";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("Withdrawal", () => {
  const playbook = new Playbook();
  const helper = new Helper();
  const playbookRoot = "src/playbook";
  const l2Token = playbookRoot + "/" + Buffer.L2deposited;
  const l1Token = playbookRoot + "/" + Buffer.L1;

  let result: string;
  jest.setTimeout(localConfig.extendedTimeout);

  describe("Withdrawal ETH to the own address", () => {
    //@id639
    it("Make a withdrawal to the own address with 0.0000001 ETH ", async () => {
      result = await playbook.withdrawETH();
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });

    //@id1458
    it("Verify the ETH withdrawal via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${result}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(result))
        .expect((res) => expect(res.body.to).toBe("0x000000000000000000000000000000000000800A"))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.value).toBe("9000000000000"));
    });

    //@id1459
    it("Verify the ETH withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${result}/transfers`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_ERC20_Address }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" })))
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });
  });

  describe("Withdrawal ETH to the other address", () => {
    //@id640
    it("Make a withdrawal to the other address with 0.0000001 ETH ", async () => {
      result = await playbook.withdrawETHtoOtherAddress();
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });

    //@id1460
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${result}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(result))
        .expect((res) => expect(res.body.to).toBe("0x000000000000000000000000000000000000800A"))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress))
        .expect((res) => expect(res.body.value).toBe("9000000000000"));
    });

    //@id1461
    it("Verify the ETH withdrawal to the other address via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${result}/transfers`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_ERC20_Address }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ type: "transfer" })))
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.mainWalletAddress }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ amount: "9000000000000" })))
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ type: "withdrawal" })))
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ from: Token.ETHER_PULL_Address }))
        )
        .expect((res) =>
          expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });
  });

  describe("Withdrawal the custom token to the own address", () => {
    //@id641
    it("Make the custom token withdrawal to the own address", async () => {
      const customToken = await helper.getStringFromFile(l2Token);
      result = await playbook.withdrawERC20(customToken);
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });

    //@id1462
    it("Verify the custom token withdrawal via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${result}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(result))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress));
    });

    //@id1463
    it("Verify the custom token withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const customTokenL2 = await helper.getStringFromFile(l2Token);
      const customTokenL1 = await helper.getStringFromFile(l1Token);
      const apiRoute = `/transactions/${result}/transfers`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_Address })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
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
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
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
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });
  });

  describe("Withdrawal the custom token to the other address", () => {
    //@id643
    it("Make the custom token withdrawal to the other address", async () => {
      const customToken = await helper.getStringFromFile(l2Token);
      result = await playbook.withdrawERC20toOtherAddress(customToken);
      await expect(result).not.toBeUndefined();
      await expect(result.includes(Logger.txHashStartsWith)).toBe(true);
    });

    //@id1462
    it("Verify the custom token withdrawal via /transactions/{transactionHash}", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const apiRoute = `/transactions/${result}`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.hash).toBe(result))
        .expect((res) => expect(res.body.from).toBe(Wallets.richWalletAddress));
    });

    //@id1463
    it("Verify the custom token withdrawal via /transactions/{transactionHash}/transfers", async () => {
      await setTimeout(localConfig.standardPause); //works unstable without timeout
      const customTokenL2 = await helper.getStringFromFile(l2Token);
      const customTokenL1 = await helper.getStringFromFile(l1Token);
      const apiRoute = `/transactions/${result}/transfers`;

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) =>
          expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_PULL_Address }))
        )
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[0]).toStrictEqual(expect.objectContaining({ type: "fee" })))
        .expect((res) =>
          expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ from: Wallets.richWalletAddress }))
        )
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ to: Token.ETHER_Address })))
        .expect((res) => expect(res.body.items[1]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
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
          expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ to: Wallets.mainWalletAddress }))
        )
        .expect((res) => expect(res.body.items[2]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
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
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ transactionHash: result })))
        .expect((res) => expect(res.body.items[3]).toStrictEqual(expect.objectContaining({ type: "refund" })));
    });
  });
});
