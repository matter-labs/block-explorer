import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { BatchDetails } from "../src/batch/batchDetails.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { Counter } from "../src/counter/counter.entity";

describe("StatsController (e2e)", () => {
  let app: INestApplication;
  let batchRepository: Repository<BatchDetails>;
  let blockRepository: Repository<BlockDetails>;
  let transactionRepository: Repository<Transaction>;
  let counterRepository: Repository<Counter>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    counterRepository = app.get<Repository<Counter>>(getRepositoryToken(Counter));

    for (let i = 0; i < 6; i++) {
      const isExecuted = i < 3;
      await batchRepository.insert({
        number: i,
        rootHash: `0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a360${i}`,
        timestamp: new Date("2022-11-10T14:44:05.000Z"),
        l1GasPrice: "10000000",
        l2FairGasPrice: "20000000",
        l1TxCount: 1,
        l2TxCount: 2,
        commitTxHash: isExecuted ? "0x546b26df0927cd01611e41b136b35317a991597ed7a01843b5f47460a3549a2b" : null,
        proveTxHash: isExecuted ? "0x253d496e6dc5a019f12a2b560798a222657f37f4da29dafcd100ba97c79baddc" : null,
        executeTxHash: isExecuted ? "0xebbe54f44eb960094264315bbddf468871e489abbd4d9af9e3bd96e38f08ddab" : null,
        committedAt: isExecuted ? new Date("2022-11-10T14:44:06.000Z") : null,
        provenAt: isExecuted ? new Date("2022-11-10T14:44:07.000Z") : null,
        executedAt: isExecuted ? new Date("2022-11-10T14:44:08.000Z") : null,
      });
    }

    for (let i = 0; i < 10; i++) {
      await blockRepository.insert({
        number: i + 1,
        hash: `0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79c0${i}`,
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        gasLimit: "0",
        gasUsed: "0",
        baseFeePerGas: "100000000",
        extraData: "0x",
        l1BatchNumber: i < 5 ? 2 : 5,
        l1TxCount: 1,
        l2TxCount: 1,
        miner: "0x0000000000000000000000000000000000000000",
      });
    }

    for (let i = 0; i < 10; i++) {
      await transactionRepository.insert({
        hash: `0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e0${i}`,
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        transactionIndex: 3233097 + i,
        data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
        value: "0x2386f26fc10000",
        fee: "0x2386f26fc10000",
        nonce: 42,
        blockNumber: 1,
        blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
        receivedAt: "2022-11-21T18:16:51.000Z",
        isL1Originated: true,
        l1BatchNumber: 2,
        receiptStatus: 1,
        gasLimit: "1000000",
        gasPrice: "100",
        type: 255,
      });
    }

    await counterRepository.insert({
      tableName: "transactions",
      queryString: "",
      count: 10,
    });
  });

  afterAll(async () => {
    await transactionRepository.delete({});
    await blockRepository.delete({});
    await batchRepository.delete({});

    await app.close();
  });

  describe("/stats GET", () => {
    it("returns HTTP 200 with blockchain stats", () => {
      return request(app.getHttpServer())
        .get("/stats")
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            lastSealedBatch: 5,
            lastVerifiedBatch: 2,
            lastSealedBlock: 10,
            lastVerifiedBlock: 5,
            totalTransactions: 10,
          })
        );
    });
  });
});
