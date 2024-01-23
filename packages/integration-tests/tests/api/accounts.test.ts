import * as request from "supertest";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Token, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";

describe("API module: Account", () => {
  jest.setTimeout(localConfig.standardTimeout);

  const helper = new Helper();
  let apiRoute: string;
  let response;

  //@id1704
  it("Verify /api?module=account&action=balancemulti response", async () => {
    await helper.retryTestAction(async () => {
      apiRoute = `/api?module=account&action=balancemulti&address=${Wallets.richWalletAddress},${Wallets.mainWalletAddress}`;
      const richWalletBalance = await helper.getBalanceETH(Wallets.richWalletAddress, "L2");
      const mainWalletBalance = await helper.getBalanceETH(Wallets.mainWalletAddress, "L2");
      const richWalletLowerCase = Wallets.richWalletAddress.toLowerCase();
      const mainWalletLowerCase = Wallets.mainWalletAddress.toLowerCase();
      response = await helper.performGETrequest(apiRoute);

      expect(response.status).toBe(200);
      expect(response.body.result.length).toBeGreaterThan(1);
      expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
      expect(response.body.result[0]).toStrictEqual(
        expect.objectContaining({ account: richWalletLowerCase, balance: richWalletBalance })
      );
      expect(response.body.result[1]).toStrictEqual(
        expect.objectContaining({ account: mainWalletLowerCase, balance: mainWalletBalance })
      );
    });
  });

  //@id1703
  it("Verify /api?module=account&action=balance response", async () => {
    await helper.retryTestAction(async () => {
      const balance = await helper.getBalanceETH(Wallets.richWalletAddress, "L2");
      apiRoute = `/api?module=account&action=balance&address=${Wallets.richWalletAddress}`;
      response = await helper.performGETrequest(apiRoute);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ result: balance }));
    });
  });

  //@id1705
  it("Verify /api?module=account&action=tokenbalance response", async () => {
    await helper.retryTestAction(async () => {
      apiRoute = `/api?module=account&action=tokenbalance&contractaddress=${Token.ETHER_ERC20_Address}&address=${Wallets.richWalletAddress}`;
      response = await helper.performGETrequest(apiRoute);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
      expect(typeof response.body.result).toStrictEqual("string");
    });
  });

  //@id1702
  it("Verify /api?module=account&action=txlist response", async () => {
    await helper.retryTestAction(async () => {
      const blocks = await request(environment.blockExplorerAPI).get("/blocks");
      const blockNumber = blocks.body.items[0].number;
      apiRoute = `/api?module=account&action=txlist&page=1&offset=10&sort=desc&endblock${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
      response = await helper.performGETrequest(apiRoute);

      expect(response.status).toBe(200);
      expect(response.body.result.length).toBeGreaterThan(1);
      expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
      expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
      expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
      expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
      expect(typeof response.body.result[0].hash).toStrictEqual("string");
      expect(typeof response.body.result[0].nonce).toStrictEqual("string");
      expect(typeof response.body.result[0].blockHash).toStrictEqual("string");
      expect(typeof response.body.result[0].transactionIndex).toStrictEqual("string");
      expect(typeof response.body.result[0].from).toStrictEqual("string");
      expect(typeof response.body.result[0].to).toStrictEqual("string");
      expect(typeof response.body.result[0].value).toStrictEqual("string");
      expect(typeof response.body.result[0].gas).toStrictEqual("string");
      expect(typeof response.body.result[0].gasPrice).toStrictEqual("string");
      expect(typeof response.body.result[0].isError).toStrictEqual("string");
      expect(typeof response.body.result[0].txreceipt_status).toStrictEqual("string");
      expect(typeof response.body.result[0].input).toStrictEqual("string");
      expect(typeof response.body.result[0].contractAddress).toBeTruthy(); // can be null
      expect(typeof response.body.result[0].cumulativeGasUsed).toStrictEqual("string");
      expect(typeof response.body.result[0].gasUsed).toStrictEqual("string");
      expect(typeof response.body.result[0].confirmations).toStrictEqual("string");
      expect(typeof response.body.result[0].fee).toStrictEqual("string");
      expect(typeof response.body.result[0].commitTxHash).toStrictEqual("string");
      expect(typeof response.body.result[0].proveTxHash).toStrictEqual("string");
      expect(typeof response.body.result[0].executeTxHash).toStrictEqual("string");
      expect(typeof response.body.result[0].isL1Originated).toStrictEqual("string");
      expect(typeof response.body.result[0].l1BatchNumber).toStrictEqual("string");
      expect(typeof response.body.result[0].methodId).toStrictEqual("string");
      expect(typeof response.body.result[0].functionName).toStrictEqual("string");
    });
  });
});
