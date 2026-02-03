import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { Repository } from "typeorm";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

describe("Transaction API (e2e)", () => {
  let app: INestApplication;
  let transactionRepository: Repository<Transaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let blockRepository: Repository<BlockDetails>;

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

    await transactionRepository.insert({
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
      value: "0x2386f26fc10000",
      fee: "0x2386f26fc10000",
      nonce: 42,
      blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      isL1Originated: true,
      hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
      transactionIndex: 1,
      blockNumber: 1,
      receivedAt: "2010-11-21T18:16:00.000Z",
      receiptStatus: 1,
      gasLimit: "1000000",
      gasPrice: "100",
      type: 255,
    });

    await transactionReceiptRepository.insert({
      transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe350",
      status: 0,
      gasUsed: "900000",
      cumulativeGasUsed: "1100000",
    });

    await transactionReceiptRepository.insert({
      transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe350",
      status: 1,
      gasUsed: "900000",
      cumulativeGasUsed: "1100000",
    });
  });

  afterAll(async () => {
    await transactionReceiptRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe("/api?module=transaction&action=getstatus GET", () => {
    it("returns HTTP 200 and default response when transaction is not found", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=transaction&action=getstatus&txhash=0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e21`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              isError: "0",
              errDescription: "",
            },
          })
        );
    });

    it("returns HTTP 200 and status response when transaction status is failed", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=transaction&action=getstatus&txhash=0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              isError: "1",
              errDescription: "",
            },
          })
        );
    });

    it("returns HTTP 200 and status response when transaction status is included", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=transaction&action=getstatus&txhash=0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              isError: "0",
              errDescription: "",
            },
          })
        );
    });
  });

  describe("/api?module=transaction&action=gettxreceiptstatus GET", () => {
    it("returns HTTP 200 and default response when transaction receipt is not found", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=transaction&action=gettxreceiptstatus&txhash=0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e21`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              status: "",
            },
          })
        );
    });

    it("returns HTTP 200 and status response when transaction receipt status is 0", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=transaction&action=gettxreceiptstatus&txhash=0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              status: "0",
            },
          })
        );
    });

    it("returns HTTP 200 and status response when transaction receipt status is 1", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=transaction&action=gettxreceiptstatus&txhash=0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              status: "1",
            },
          })
        );
    });
  });
});
