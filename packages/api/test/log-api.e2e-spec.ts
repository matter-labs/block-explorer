import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { Repository } from "typeorm";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Log } from "../src/log/log.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

describe("Logs API (e2e)", () => {
  let app: INestApplication;
  let transactionRepository: Repository<Transaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let blockRepository: Repository<BlockDetails>;
  let logRepository: Repository<Log>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    transactionReceiptRepository = app.get<Repository<TransactionReceipt>>(getRepositoryToken(TransactionReceipt));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    logRepository = app.get<Repository<Log>>(getRepositoryToken(Log));

    await blockRepository.insert({
      number: 0,
      hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      timestamp: new Date("2022-11-10T14:44:08.000Z"),
      gasLimit: "0",
      gasUsed: "0",
      baseFeePerGas: "100000000",
      extraData: "0x",
      l1TxCount: 1,
      l2TxCount: 1,
      miner: "0x0000000000000000000000000000000000000000",
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
      miner: "0x0000000000000000000000000000000000000000",
    });

    await transactionRepository.insert({
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
      value: "0x2386f26fc10000",
      fee: "0x2386f26fc10000",
      nonce: 42,
      blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      isL1Originated: true,
      hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
      transactionIndex: 1,
      blockNumber: 1,
      receivedAt: "2010-11-21T18:16:00.000Z",
      receiptStatus: 0,
      gasLimit: "1000000",
      gasPrice: "100",
      type: 255,
    });

    await transactionReceiptRepository.insert({
      transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      status: 1,
      gasUsed: "900000",
      cumulativeGasUsed: "1100000",
      contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
    });

    for (let i = 0; i < 4; i++) {
      await logRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
        topics: [
          "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
          "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
          "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
          "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
        ],
        data: "0x",
        blockNumber: i < 2 ? 0 : 1,
        transactionIndex: 1,
        logIndex: i + 1,
        timestamp: "2022-11-21T18:16:51.000Z",
        transactionHash: i % 2 ? "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20" : null,
      });
    }
  });

  afterAll(async () => {
    await logRepository.createQueryBuilder().delete().execute();
    await transactionReceiptRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe("/api?module=logs&action=getLogs GET", () => {
    it("returns HTTP 200 and no records found response when no logs found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=logs&action=getLogs&address=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb66`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "No record found",
            result: [],
          })
        );
    });

    it("returns HTTP 200 and logs list when logs found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=logs&action=getLogs&address=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x0",
                data: "0x",
                gasPrice: "0x",
                gasUsed: "0x",
                logIndex: "0x1",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: null,
                transactionIndex: "0x1",
              },
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x0",
                data: "0x",
                gasPrice: "0x64",
                gasUsed: "0xdbba0",
                logIndex: "0x2",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                transactionIndex: "0x1",
              },
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x1",
                data: "0x",
                gasPrice: "0x",
                gasUsed: "0x",
                logIndex: "0x3",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: null,
                transactionIndex: "0x1",
              },
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x1",
                data: "0x",
                gasPrice: "0x64",
                gasUsed: "0xdbba0",
                logIndex: "0x4",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                transactionIndex: "0x1",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and logs list for the specified paging params", () => {
      return request(app.getHttpServer())
        .get(`/api?module=logs&action=getLogs&address=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67&offset=2&page=2`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x1",
                data: "0x",
                gasPrice: "0x",
                gasUsed: "0x",
                logIndex: "0x3",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: null,
                transactionIndex: "0x1",
              },
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x1",
                data: "0x",
                gasPrice: "0x64",
                gasUsed: "0xdbba0",
                logIndex: "0x4",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                transactionIndex: "0x1",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and logs list for the specified toBlock filter param", () => {
      return request(app.getHttpServer())
        .get(`/api?module=logs&action=getLogs&address=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67&toBlock=0`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x0",
                data: "0x",
                gasPrice: "0x",
                gasUsed: "0x",
                logIndex: "0x1",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: null,
                transactionIndex: "0x1",
              },
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x0",
                data: "0x",
                gasPrice: "0x64",
                gasUsed: "0xdbba0",
                logIndex: "0x2",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                transactionIndex: "0x1",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and logs list for the specified fromBlock filter param", () => {
      return request(app.getHttpServer())
        .get(`/api?module=logs&action=getLogs&address=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67&fromBlock=1`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x1",
                data: "0x",
                gasPrice: "0x",
                gasUsed: "0x",
                logIndex: "0x3",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: null,
                transactionIndex: "0x1",
              },
              {
                address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                blockNumber: "0x1",
                data: "0x",
                gasPrice: "0x64",
                gasUsed: "0xdbba0",
                logIndex: "0x4",
                timeStamp: "0x637bc093",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                transactionIndex: "0x1",
              },
            ],
            status: "1",
          })
        );
    });
  });
});
