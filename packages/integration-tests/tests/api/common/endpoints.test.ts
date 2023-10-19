import * as request from "supertest";
import { setTimeout } from "timers/promises";

import { environment, localConfig } from "../../../src/config";
import { Buffer, Token, Wallets } from "../../../src/entities";
import { Helper } from "../../../src/helper";

describe("Endpoints", () => {
  const helper = new Helper();
  const bufferRoute = "src/playbook/";

  jest.setTimeout(localConfig.extendedTimeout);

  describe("/stats", () => {
    //@id1515
    it("Verify the response via /stats", async () => {
      const apiRoute = `/stats`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(typeof res.body.lastSealedBatch).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.lastVerifiedBatch).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.lastSealedBlock).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.lastVerifiedBlock).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.totalTransactions).toStrictEqual("number"));
    });
  });

  describe("/tokens", () => {
    //@id1508
    it("Verify the response via /tokens", async () => {
      const l2DepositedToken = await helper.getStringFromFile(bufferRoute + Buffer.L2deposited);
      const l1Token = await helper.getStringFromFile(bufferRoute + Buffer.L1);
      const l2Token = await helper.getStringFromFile(bufferRoute + Buffer.L2);

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

  describe("/batches", () => {
    //@id1513
    it("Verify the response via /batches", async () => {
      const apiRoute = `/batches`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
        .expect((res) => expect(res.body.items.length).toBeGreaterThanOrEqual(1))
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

    //@id1514
    it("Verify the response via /batches/{batchNumber}", async () => {
      const batches = await request(environment.blockExplorerAPI).get("/batches");

      const batchNumber = batches.body.items[0].number;

      const apiRoute = `/batches/${batchNumber}`;

      await setTimeout(localConfig.standardPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body.number).toStrictEqual(batchNumber))
        .expect((res) => expect(typeof res.body.timestamp).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.rootHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.executedAt).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.l1TxCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.l2TxCount).toStrictEqual("number"))
        .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.committedAt).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.proveTxHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.provenAt).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.executeTxHash).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.l1GasPrice).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.l2FairGasPrice).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.size).toStrictEqual("number"))
        .expect((res) => expect(res.body.status).toStrictEqual("verified"));
    });
  });

  describe("/blocks", () => {
    //@id1511
    it("Verify the response via /blocks", async () => {
      const apiRoute = `/blocks`;

      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body.items)).toStrictEqual(true))
        .expect((res) => expect(res.body.items.length).toBeGreaterThan(1))
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

    //@id1512
    it("Verify the response via /blocks/{/blockNumber}", async () => {
      const blocks = await request(environment.blockExplorerAPI).get("/blocks");

      const blockNumber = blocks.body.items[0].number;

      const apiRoute = `/blocks/${blockNumber}`;

      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      return (
        request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) => expect(res.body.number).toStrictEqual(blockNumber))
          .expect((res) => expect(typeof res.body.hash).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.timestamp).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.gasUsed).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.l1BatchNumber).toStrictEqual("number"))
          .expect((res) => expect(typeof res.body.l1TxCount).toStrictEqual("number"))
          .expect((res) => expect(typeof res.body.l2TxCount).toStrictEqual("number"))
          .expect((res) => expect(typeof res.body.parentHash).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.gasLimit).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.baseFeePerGas).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.extraData).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.size).toStrictEqual("number"))
          .expect((res) => expect(typeof res.body.status).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.isL1BatchSealed).toStrictEqual("boolean"))
          .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string"))
          // .expect((res) => expect(typeof res.body.commitTxHash).toStrictEqual("string")) //unstable on a CI
          .expect((res) => expect(typeof res.body.proveTxHash).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.committedAt).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.executedAt).toStrictEqual("string"))
          .expect((res) => expect(typeof res.body.provenAt).toStrictEqual("string"))
      );
    });
  });

  describe("Accounts API", () => {
    //@id1704
    it(
      "Verify /api?module=account&action=balancemulti response returns elements" +
        " balancemulti => balancemulti&address={account_address1},{account_address2}",
      async () => {
        const apiRoute = `/api?module=account&action=balancemulti&address=${Wallets.richWalletAddress},${Wallets.mainWalletAddress}`;
        const richWalletBalance = await helper.getBalanceETH(Wallets.richWalletAddress, "L2");
        const mainWalletBalance = await helper.getBalanceETH(Wallets.mainWalletAddress, "L2");
        const richWalletLowerCase = Wallets.richWalletAddress.toLowerCase();
        const mainWalletLowerCase = Wallets.mainWalletAddress.toLowerCase();
        await setTimeout(localConfig.extendedPause); //works unstable without timeout

        return request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) => expect(res.body.result.length).toBeGreaterThan(1))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
          .expect((res) =>
            expect(res.body.result[0]).toStrictEqual(
              expect.objectContaining({ account: richWalletLowerCase, balance: richWalletBalance })
            )
          )
          .expect((res) =>
            expect(res.body.result[1]).toStrictEqual(
              expect.objectContaining({ account: mainWalletLowerCase, balance: mainWalletBalance })
            )
          );
      }
    );

    //@id1703
    it(
      "Verify /api?module=account&action=balance response returns elements" +
        "balance => balance&address={account_address}",
      async () => {
        const apiRoute = `/api?module=account&action=balance&address=${Wallets.richWalletAddress}`;
        const balance = await helper.getBalanceETH(Wallets.richWalletAddress, "L2");
        await setTimeout(localConfig.extendedPause); //works unstable without timeout

        return request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ result: balance })));
      }
    );

    //@id1705
    it(
      "Verify /api?module=account&action=tokenbalance response returns elements" +
        " tokenbalance => tokenbalance&contractaddress={contract_address}&address={account_address}",
      async () => {
        const apiRoute = `/api?module=account&action=tokenbalance&contractaddress=${Token.ETHER_ERC20_Address}&address=${Wallets.richWalletAddress}`;
        await setTimeout(localConfig.extendedPause); //works unstable without timeout

        return request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
          .expect((res) => expect(typeof res.body.result).toStrictEqual("string"));
      }
    );

    //@id1702
    it(
      "Verify /api?module=account&action=txlist response returns elements" +
        " txlist => txlist&page=1&offset=10&sort=desc&endblock{block_number}&startblock=0&address={account_address}",
      async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/blocks");

        const blockNumber = blocks.body.items[0].number;
        const apiRoute = `/api?module=account&action=txlist&page=1&offset=10&sort=desc&endblock${blockNumber}&startblock=0&address=${Wallets.richWalletAddress}`;

        await setTimeout(localConfig.extendedPause); //works unstable without timeout

        return (
          request(environment.blockExplorerAPI)
            .get(apiRoute)
            .expect(200)
            .expect((res) => expect(res.body.result.length).toBeGreaterThan(1))
            .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
            .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
            .expect((res) => expect(typeof res.body.result[0].blockNumber).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].timeStamp).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].hash).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].nonce).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].blockHash).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].transactionIndex).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].from).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].to).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].value).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].gas).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].gasPrice).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].isError).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].txreceipt_status).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].input).toStrictEqual("string"))
            // .expect((res) => expect(typeof res.body.result[0].contractAddress).toStrictEqual("string")) // can be null
            .expect((res) => expect(typeof res.body.result[0].cumulativeGasUsed).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].gasUsed).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].confirmations).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].fee).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].commitTxHash).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].proveTxHash).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].executeTxHash).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].isL1Originated).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].l1BatchNumber).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].methodId).toStrictEqual("string"))
            .expect((res) => expect(typeof res.body.result[0].functionName).toStrictEqual("string"))
        );
      }
    );
  });

  describe("Transactions API", () => {
    //@id1697
    it(
      "Verify /api?module=transaction&action=getstatus response returns elements" +
        " getstatus => getstatus&txhash={tx_hash}",
      async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/transactions");

        const txHash = blocks.body.items[0].hash;
        const apiRoute = `/api?module=transaction&action=getstatus&txhash=${txHash}`;
        await setTimeout(localConfig.extendedPause); //works unstable without timeout

        return request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
          .expect((res) =>
            expect(res.body.result).toStrictEqual(expect.objectContaining({ isError: "0", errDescription: "" }))
          );
      }
    );

    //@id1698
    it(
      "Verify /api?module=transaction&action=gettxreceiptstatus response returns elements" +
        " gettxreceiptstatus => gettxreceiptstatus&txhash={tx_hash}",
      async () => {
        const blocks = await request(environment.blockExplorerAPI).get("/transactions");

        const txHash = blocks.body.items[0].hash;
        const apiRoute = `/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
        await setTimeout(localConfig.extendedPause); //works unstable without timeout

        return request(environment.blockExplorerAPI)
          .get(apiRoute)
          .expect(200)
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
          .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
          .expect((res) => expect(typeof res.body.result.status).toStrictEqual("string"));
      }
    );
  });

  describe("Block API", () => {
    const bufferRoute = "src/playbook/";
    //@id1700
    it("Verify /api?module=block&action=getblockcountdown&blockno={block_number} response returns elements", async () => {
      const blocks = await request(environment.blockExplorerAPI).get("/blocks");

      const blockNumber = blocks.body.items[0].number + 1;
      const apiRoute = `/api?module=block&action=getblockcountdown&blockno=${blockNumber}`;
      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
        .expect((res) => expect(typeof res.body.result.CurrentBlock).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.CountdownBlock).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.RemainingBlock).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.EstimateTimeInSec).toStrictEqual("string"));
    });

    //@id1699
    it("Verify /api?module=block&action=getblocknobytime&closest=before&timestamp={timestamp} response returns elements", async () => {
      const apiRoute = `/api?module=block&action=getblocknobytime&closest=before&timestamp=1635934550`;
      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
        .expect((res) => expect(typeof res.body.result).toStrictEqual("string"));
    });

    //@id1701
    it("Verify /api?module=block&action=getblockreward&blockno={blockNumber} response returns elements", async () => {
      const blocks = await request(environment.blockExplorerAPI).get("/blocks");

      const blockNumber = blocks.body.items[0].number;
      const apiRoute = `/api?module=block&action=getblockreward&blockno=${blockNumber}`;
      await setTimeout(localConfig.extendedPause); //works unstable without timeout

      return request(environment.blockExplorerAPI)
        .get(apiRoute)
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ status: "1" })))
        .expect((res) => expect(res.body).toStrictEqual(expect.objectContaining({ message: "OK" })))
        .expect((res) => expect(typeof res.body.result.blockNumber).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.timeStamp).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.blockMiner).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.blockReward).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.uncleInclusionReward).toStrictEqual("string"))
        .expect((res) => expect(typeof res.body.result.uncles).toStrictEqual("object"));
    });
  });
});
