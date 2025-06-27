import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { Token } from "../src/token/token.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { AddressTransaction } from "../src/transaction/entities/addressTransaction.entity";
import { Transfer } from "../src/transfer/transfer.entity";
import { Log } from "../src/log/log.entity";
import { BatchDetails } from "../src/batch/batchDetails.entity";
import { numberToHex } from "../src/common/utils";
import { zeroPadValue } from "ethers";
import { applyPrividiumExpressConfig } from "../src/prividium";
import { ConfigService } from "@nestjs/config";
import { Wallet } from "zksync-ethers";

describe("TransactionController (e2e)", () => {
  let app: INestApplication;
  let tokenRepository: Repository<Token>;
  let blockRepository: Repository<BlockDetails>;
  let transactionRepository: Repository<Transaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transferRepository: Repository<Transfer>;
  let logRepository: Repository<Log>;
  let batchRepository: Repository<BatchDetails>;
  let configService: ConfigService;

  const secKey1 = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const secKey2 = new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const secKey3 = new Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
  const address1 = secKey1.address;
  const address2 = secKey2.address;
  const address3 = secKey3.address;
  const exampleContractAddress = "0x000000000000000000000000000000000000000c";

  const txHashes = [];

  let txIndex = 0;
  const txHash = (): string => {
    const hash = `0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9e000${txIndex
      .toString()
      .padStart(3, "0")}`;
    txIndex++;
    return hash;
  };

  async function storeTransactionAcrossSystem(from: string, to: string, logTopics: string[][]): Promise<string> {
    const baseTxPayload = {
      data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
      value: "0x2386f26fc10000",
      fee: "0x2386f26fc10000",
      nonce: 42,
      blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      isL1Originated: true,
      gasLimit: "1000000",
      gasPrice: "100",
      type: 255,
    };

    const transactionSpec = {
      ...baseTxPayload,
      transactionIndex: 1,
      blockNumber: 1,
      receivedAt: `2022-11-21T18:16:00.000Z`,
      l1BatchNumber: 1,
      receiptStatus: 1,
      gasPrice: BigInt(1000).toString(),
      gasLimit: BigInt(2000).toString(),
      maxFeePerGas: BigInt(3000).toString(),
      maxPriorityFeePerGas: BigInt(4000).toString(),
      gasPerPubdata: numberToHex(BigInt(5000)),
    };

    const hash = txHash();
    await transactionRepository.insert({
      ...transactionSpec,
      from: from,
      to: to,
      hash: hash,
    });

    await addressTransactionRepository.insert({
      transactionHash: hash,
      address: from,
      blockNumber: transactionSpec.blockNumber,
      receivedAt: transactionSpec.receivedAt,
      transactionIndex: transactionSpec.transactionIndex,
    });

    if (from !== to) {
      await addressTransactionRepository.insert({
        transactionHash: hash,
        address: to,
        blockNumber: transactionSpec.blockNumber,
        receivedAt: transactionSpec.receivedAt,
        transactionIndex: transactionSpec.transactionIndex,
      });
    }

    await transactionReceiptRepository.insert({
      transactionHash: hash,
      from,
      status: 1,
      gasUsed: (7000).toString(),
      cumulativeGasUsed: (10000).toString(),
      to,
    });

    const promises = logTopics.map((topics, i) => {
      return logRepository.insert({
        address: `0x000000000000000000000000000000000000800${i}`,
        topics: topics.map((t) => zeroPadValue(t, 32)),
        data: "0x",
        blockNumber: 1,
        transactionHash: hash,
        transactionIndex: 1,
        logIndex: i + 1,
        timestamp: "2022-11-21T18:16:00.000Z",
      });
    });

    await Promise.all(promises);
    return hash;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();
    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);
    configService = moduleFixture.get(ConfigService);
    applyPrividiumExpressConfig(app, {
      sessionSecret: configService.get<string>("prividium.privateRpcSecret"),
      appUrl: configService.get<string>("appUrl"),
      sessionMaxAge: configService.get<number>("prividium.sessionMaxAge"),
      sessionSameSite: configService.get<"none" | "strict" | "lax">("prividium.sessionSameSite"),
    });

    await app.init();

    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    transactionReceiptRepository = app.get<Repository<TransactionReceipt>>(getRepositoryToken(TransactionReceipt));
    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transferRepository = app.get<Repository<Transfer>>(getRepositoryToken(Transfer));
    logRepository = app.get<Repository<Log>>(getRepositoryToken(Log));
    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));

    await batchRepository.insert({
      number: 1,
      timestamp: new Date("2022-11-10T14:44:08.000Z"),
      l1TxCount: 10,
      l2TxCount: 20,
      l1GasPrice: "10000000",
      l2FairGasPrice: "20000000",
      commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa1",
      committedAt: new Date("2022-11-10T14:44:08.000Z"),
      proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac1",
      provenAt: new Date("2022-11-10T14:44:08.000Z"),
      executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab1",
      executedAt: new Date("2022-11-10T14:44:08.000Z"),
    });

    await blockRepository.insert({
      number: 1,
      hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      timestamp: new Date("2022-11-10T14:44:08.000Z"),
      gasLimit: "0",
      gasUsed: "0",
      baseFeePerGas: "100000000",
      extraData: "0x",
      l1TxCount: 1,
      l2TxCount: 1,
      l1BatchNumber: 1,
      miner: "0x0000000000000000000000000000000000000000",
    });

    const zeroTopic = zeroPadValue("0x", 32);

    // 0: address1, address2
    // 1: address1, address2
    // 2: address1, contract
    // 3: address1, address2
    // 4: address1, address2
    // 5: address1, address2
    // 6: address2, address3
    txHashes.push(await storeTransactionAcrossSystem(address1, address2, [])); // 0
    txHashes.push(await storeTransactionAcrossSystem(address2, address1, [])); // 1
    txHashes.push(await storeTransactionAcrossSystem(address1, exampleContractAddress, [])); // 2
    txHashes.push(await storeTransactionAcrossSystem(address1, exampleContractAddress, [[zeroTopic, address2]])); // 3
    txHashes.push(
      await storeTransactionAcrossSystem(address1, exampleContractAddress, [[zeroTopic, zeroTopic, address2]])
    ); // 4
    txHashes.push(
      await storeTransactionAcrossSystem(address1, exampleContractAddress, [
        [zeroTopic, zeroTopic, zeroTopic, address2],
      ])
    ); // 5

    txHashes.push(await storeTransactionAcrossSystem(address2, address3, [])); // 6
  });

  afterAll(async () => {
    await logRepository.delete({});
    await transferRepository.delete({});
    await tokenRepository.delete({});
    await addressTransactionRepository.delete({});
    await transactionRepository.delete({});
    await transactionReceiptRepository.delete({});
    await blockRepository.delete({});
    await batchRepository.delete({});

    await app.close();
  });

  async function generateCookieFor(secKey: Wallet): Promise<string> {
    const agent = request(app.getHttpServer());
    const r = await agent
      .post("/auth/message")
      .send({ address: secKey.address })
      .expect("set-cookie", /_auth=/)
      .expect(201);

    const s = r.text;
    const sig = await secKey.signMessage(s);

    const verifyRes = await agent
      .post("/auth/verify")
      .set("Cookie", r.get("set-cookie"))
      .send({ signature: sig })
      .expect(201);

    return verifyRes.get("set-cookie");
  }

  describe("/transactions GET", () => {
    it("returns Unauthorized when no cookie", async () => {
      // no cookie set
      return request(app.getHttpServer()).get("/transactions").expect(401);
    });

    it("returns ok when correct cookie is provided", async () => {
      const cookie = await generateCookieFor(secKey1);

      return request(app.getHttpServer()).get("/transactions").set("Cookie", cookie).expect(200);
    });

    it("returns the tranasactions that the first user can see", async () => {
      const cookie = await generateCookieFor(secKey1);

      return request(app.getHttpServer())
        .get("/transactions")
        .set("Cookie", cookie)
        .expect(200)
        .expect((res) => {
          const hashes = res.body.items.map((tx) => tx.hash);
          expect(hashes).toEqual([txHashes[0], txHashes[1], txHashes[2], txHashes[3], txHashes[4], txHashes[5]]);
        });
    });

    it("returns transactions that second user can see", async () => {
      const cookie = await generateCookieFor(secKey2);

      return request(app.getHttpServer())
        .get("/transactions")
        .set("Cookie", cookie)
        .expect(200)
        .expect((res) => {
          const hashes = res.body.items.map((tx) => tx.hash);

          expect(hashes).toHaveLength(6);
          expect(hashes).toContain(txHashes[0]);
          expect(hashes).toContain(txHashes[1]);
          expect(hashes).toContain(txHashes[3]);
          expect(hashes).toContain(txHashes[4]);
          expect(hashes).toContain(txHashes[5]);
          expect(hashes).toContain(txHashes[6]);
        });
    });

    it("when restricted to an address shows transactions where user appears in logs", async () => {
      const cookie = await generateCookieFor(secKey2);

      return request(app.getHttpServer())
        .get(`/transactions?address=${exampleContractAddress}`)
        .set("Cookie", cookie)
        .expect(200)
        .expect((res) => {
          const hashes = res.body.items.map((tx) => tx.hash);

          expect(hashes).toHaveLength(3);
          expect(hashes).toContain(txHashes[3]);
          expect(hashes).toContain(txHashes[4]);
          expect(hashes).toContain(txHashes[5]);
        });
    });
  });
});
