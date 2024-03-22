import * as request from "supertest";

import { environment } from "../../src/config";
import { localConfig } from "../../src/config";
import { Buffer, IncorrectValues, Path, Token, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";
import { Playbook } from "../../src/playbook/playbook";

describe("API module: Account", () => {
  jest.setTimeout(localConfig.extendedTimeout);

  const helper = new Helper();
  let apiRoute: string;
  let response;
  const playbook = new Playbook();

  describe("/address/{address}", () => {
    beforeAll(async () => {
      await playbook.deployNFTtoL2();
      await playbook.deployMultiTransferETH();
      await playbook.useMultiTransferETH();
      await playbook.withdrawETH();
    });

    //@id1704
    it("Verify /api?module=account&action=balancemulti response", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=balancemulti&address=${Wallets.richWalletAddress},${Wallets.mainWalletAddress}`;
        const richWalletBalance = await helper.getBalanceETH(Wallets.richWalletAddress, "L2");
        const mainWalletBalance = await helper.getBalanceETH(Wallets.mainWalletAddress, "L2");
        const richWalletLowerCase = Wallets.richWalletAddress.toLowerCase();
        const mainWalletLowerCase = Wallets.mainWalletAddress.toLowerCase();
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

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
      await helper.runRetriableTestAction(async () => {
        const balance = await helper.getBalanceETH(Wallets.richWalletAddress, "L2");
        apiRoute = `/api?module=account&action=balance&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: balance }));
      });
    });

    //@id1705
    it("Verify /api?module=account&action=tokenbalance response", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=tokenbalance&contractaddress=${Token.ERC20AddressETH}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result).toStrictEqual("string");
      });
    });

    //@id1702
    it("Verify /api?module=account&action=txlist response", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlist&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

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
        expect(typeof response.body.result[0].contractAddress).toBeTruthy();
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

    //@id1852
    it("Verify /api?module=account&action=txlistinternal&address=", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlistinternal&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
        expect(typeof response.body.result[0].hash).toStrictEqual("string");
        expect(typeof response.body.result[0].from).toStrictEqual("string");
        expect(typeof response.body.result[0].to).toStrictEqual("string");
        expect(typeof response.body.result[0].value).toStrictEqual("string");
        expect(typeof response.body.result[0].gas).toStrictEqual("string");
        expect(typeof response.body.result[0].input).toStrictEqual("string");
        expect(typeof response.body.result[0].type).toStrictEqual("string");
        expect(typeof response.body.result[0].contractAddress).toBeTruthy();
        expect(typeof response.body.result[0].gasUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].fee).toStrictEqual("string");
        expect(typeof response.body.result[0].l1BatchNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].traceId).toBeTruthy();
        expect(typeof response.body.result[0].transactionType).toStrictEqual("string");
        expect(typeof response.body.result[0].isError).toStrictEqual("string");
        expect(typeof response.body.result[0].errCode).toStrictEqual("string");
      });
    });

    //@id1804
    it("Verify /api?module=account&action=txlistinternal", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlistinternal&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=1`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result.length).toBeGreaterThan(1);
        expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
        expect(typeof response.body.result[0].hash).toBeTruthy(); //can be null
        expect(typeof response.body.result[0].from).toStrictEqual("string");
        expect(typeof response.body.result[0].to).toStrictEqual("string");
        expect(typeof response.body.result[0].value).toStrictEqual("string");
        expect(typeof response.body.result[0].input).toStrictEqual("string");
        expect(typeof response.body.result[0].type).toStrictEqual("string");
        expect(typeof response.body.result[0].traceId).toBeTruthy();
        expect(typeof response.body.result[0].isError).toStrictEqual("string");
        expect(typeof response.body.result[0].errCode).toStrictEqual("string");
      });
    });

    //@id1805
    it("Verify /api?module=account&action=tokentx", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokentx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${Token.ERC20AddressETH}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result.length).toBeGreaterThan(1);
        expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
        expect(typeof response.body.result[0].hash).toStrictEqual("string");
        expect(typeof response.body.result[0].nonce).toStrictEqual("string");
        expect(typeof response.body.result[0].blockHash).toStrictEqual("string");
        expect(typeof response.body.result[0].transactionIndex).toStrictEqual("string");
        expect(typeof response.body.result[0].from).toStrictEqual("string");
        expect(typeof response.body.result[0].to).toStrictEqual("string");
        expect(typeof response.body.result[0].value).toStrictEqual("string");
        expect(typeof response.body.result[0].tokenName).toStrictEqual("string");
        expect(typeof response.body.result[0].tokenSymbol).toStrictEqual("string");
        expect(typeof response.body.result[0].tokenDecimal).toStrictEqual("string");
        expect(typeof response.body.result[0].gas).toStrictEqual("string");
        expect(typeof response.body.result[0].gasPrice).toStrictEqual("string");
        expect(typeof response.body.result[0].input).toStrictEqual("string");
        expect(typeof response.body.result[0].contractAddress).toStrictEqual("string");
        expect(typeof response.body.result[0].cumulativeGasUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].contractAddress).toBeTruthy();
        expect(typeof response.body.result[0].gasUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].confirmations).toStrictEqual("string");
        expect(typeof response.body.result[0].fee).toStrictEqual("string");
        expect(typeof response.body.result[0].l1BatchNumber).toBeTruthy();
        expect(typeof response.body.result[0].transactionType).toStrictEqual("string");
      });
    });

    //@id1806
    it("Verify /api?module=account&action=tokennfttx", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        const nftAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.NFTtoL2);
        apiRoute = `/api?module=account&action=tokennfttx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${nftAddress}&address=${nftAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
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
        expect(typeof response.body.result[0].tokenID).toStrictEqual("string");
        expect(typeof response.body.result[0].gas).toStrictEqual("string");
        expect(typeof response.body.result[0].gasPrice).toStrictEqual("string");
        expect(typeof response.body.result[0].input).toStrictEqual("string");
        expect(typeof response.body.result[0].contractAddress).toStrictEqual("string");
        expect(typeof response.body.result[0].cumulativeGasUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].gasUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].confirmations).toStrictEqual("string");
        expect(typeof response.body.result[0].fee).toStrictEqual("string");
        expect(typeof response.body.result[0].l1BatchNumber).toBeTruthy();
        expect(typeof response.body.result[0].transactionType).toStrictEqual("string");
      });
    });

    //@id1807
    it("Verify /api?module=account&action=getminedblocks", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=getminedblocks&page=1&offset=10&address=0x0000000000000000000000000000000000000000`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result.length).toBeGreaterThan(1);
        expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
        expect(typeof response.body.result[0].blockReward).toStrictEqual("string");
      });
    });

    //id1854
    it("Verify /api?module=account&action=txlistinternal&txhash=", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        const txHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCall);
        apiRoute = `/api?module=account&action=txlistinternal&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&txhash=${txHash}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual(expect.objectContaining({ status: "1" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "OK" }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ hash: txHash }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ to: Wallets.richWalletAddress }));
        expect(response.body.result[0]).toStrictEqual(expect.objectContaining({ type: "call" }));
        expect(typeof response.body.result[0].blockNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].timeStamp).toStrictEqual("string");
        expect(typeof response.body.result[0].from).toStrictEqual("string");
        expect(typeof response.body.result[0].value).toStrictEqual("string");
        expect(typeof response.body.result[0].gas).toStrictEqual("string");
        expect(typeof response.body.result[0].input).toStrictEqual("string");
        expect(typeof response.body.result[0].contractAddress).toBeTruthy();
        expect(typeof response.body.result[0].gasUsed).toStrictEqual("string");
        expect(typeof response.body.result[0].fee).toStrictEqual("string");
        expect(typeof response.body.result[0].l1BatchNumber).toStrictEqual("string");
        expect(typeof response.body.result[0].traceId).toBeTruthy();
        expect(typeof response.body.result[0].transactionType).toStrictEqual("string");
        expect(typeof response.body.result[0].isError).toStrictEqual("string");
        expect(typeof response.body.result[0].errCode).toStrictEqual("string");
      });
    });
  });
  describe("API module: Account - Negative test cases", () => {
    //id1968
    it("/balance endpoint - Incorrect address format", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=balance&address=${IncorrectValues.incorrectAddressFormat}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Invalid Address format" }));
      });
    });
    //id1944
    it("/balancemulti endpoint - Incorrect address format", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=balancemulti&address=${IncorrectValues.incorrectAddressFormat}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Error! Invalid address format" }));
      });
    });

    it("/balancemulti endpoint - No address in URL parameters", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=balancemulti&address=`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Error! Missing address" }));
      });
    });

    //id1943
    it("/tokennfttx endpoint - Incorrect contract address format", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokennfttx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${IncorrectValues.incorrectAddressFormat}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ result: "Error! Invalid contract address format" })
        );
      });
    });
    it("/tokennfttx endpoint - Incorrect address format", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokennfttx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${IncorrectValues.incorrectAddressFormat}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ result: "Error! Invalid contract address format" })
        );
      });
    });

    it("/tokennfttx endpoint - Incorrect offset position in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokennfttx&page=1&offset=0&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${Wallets.richWalletAddress}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "offset must not be less than 1" }));
      });
    });

    it("/tokennfttx endpoint - Incorrect block number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blockNumber = "-99999999";
        apiRoute = `/api?module=account&action=tokennfttx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${Wallets.richWalletAddress}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({
            result: "Validation failed: specified int is out of defined boundaries: [0;9007199254740991].",
          })
        );
      });
    });

    //id1940
    it("/tokentx endpoint - Incorrect contract address format", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokentx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${IncorrectValues.incorrectAddressFormat}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({ result: "Error! Invalid contract address format" })
        );
      });
    });
    it("/tokentx endpoint - Incorrect address format", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokentx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${Wallets.richWalletAddress}&address=${IncorrectValues.incorrectAddressFormat}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Error! Invalid address format" }));
      });
    });

    it("/tokentx endpoint - Incorrect offset position in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=tokentx&page=1&offset=0&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${Wallets.richWalletAddress}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "offset must not be less than 1" }));
      });
    });

    it("/tokentx endpoint - Incorrect block number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blockNumber = "-99999999";
        apiRoute = `/api?module=account&action=tokentx&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&contractaddress=${Wallets.richWalletAddress}&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({
            result: "Validation failed: specified int is out of defined boundaries: [0;9007199254740991].",
          })
        );
      });
    });

    //id1969
    it("/getminedblocks endpoint - Incorrect contract address format", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=getminedblocks&page=1&offset=10&address=${IncorrectValues.incorrectAddressFormat}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Invalid Address format" }));
      });
    });

    it("/getminedblocks endpoint - Incorrect offset position in request", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=getminedblocks&page=1&offset=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "offset must not be less than 1" }));
      });
    });

    it("/getminedblocks endpoint - Incorrect page number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        apiRoute = `/api?module=account&action=getminedblocks&page=-1&offset=10&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "page must not be less than 1" }));
      });
    });

    //id1967
    it("/txlist endpoint - Incorrect contract address format", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlist&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${IncorrectValues.incorrectAddressFormat}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Invalid Address format" }));
      });
    });

    it("/txlist endpoint - Incorrect offset position in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlist&page=1&offset=0&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "offset must not be less than 1" }));
      });
    });

    it("/txlist endpoint - Incorrect block number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blockNumber = "-99999999";
        apiRoute = `/api?module=account&action=txlist&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({
            result: "Validation failed: specified int is out of defined boundaries: [0;9007199254740991].",
          })
        );
      });
    });

    it("/txlist endpoint - Incorrect page number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlist&page=-1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "page must not be less than 1" }));
      });
    });

    //id1935
    it("/txlistinternal endpoint - Incorrect contract address format", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlistinternal&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${IncorrectValues.incorrectAddressFormat}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "Error! Invalid address format" }));
      });
    });

    it("/txlistinternal endpoint - Incorrect offset position in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlistinternal&page=1&offset=0&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "offset must not be less than 1" }));
      });
    });

    it("/txlistinternal endpoint - Incorrect block number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blockNumber = "-99999999";
        apiRoute = `/api?module=account&action=txlistinternal&page=1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(
          expect.objectContaining({
            result: "Validation failed: specified int is out of defined boundaries: [0;9007199254740991].",
          })
        );
      });
    });

    it("/txlistinternal endpoint - Incorrect page number in request", async () => {
      await helper.runRetriableTestAction(async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");
        const blockNumber = blocks.body.items[0].number;
        apiRoute = `/api?module=account&action=txlistinternal&page=-1&offset=10&sort=desc&endblock=${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;
        response = await helper.performBlockExplorerApiGetRequest(apiRoute);

        expect(response.body).toStrictEqual(expect.objectContaining({ status: "0" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ message: "NOTOK" }));
        expect(response.body).toStrictEqual(expect.objectContaining({ result: "page must not be less than 1" }));
      });
    });
  });
});
