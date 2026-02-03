import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { BlockDetails } from "../src/block/blockDetails.entity";

describe("Block API (e2e)", () => {
  let app: INestApplication;
  let blockRepository: Repository<BlockDetails>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));

    for (let i = 10; i < 40; i++) {
      await blockRepository.insert({
        number: i,
        hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
        parentHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
        timestamp: new Date(`2022-11-10T14:44:${(0 + i.toString()).slice(-2)}.000Z`),
        gasLimit: "0",
        gasUsed: "0",
        baseFeePerGas: "100000000",
        extraData: `0x123${i}`,
        l1TxCount: i * 10,
        l2TxCount: i * 20,
        miner: "0x0000000000000000000000000000000000000000",
      });
    }
  });

  afterAll(async () => {
    await blockRepository.createQueryBuilder().delete().execute();

    await app.close();
  });

  describe("/api?module=block&action=getblocknobytime", () => {
    it("returns HTTP 200 with the found block number result for the existing block", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&closest=before&timestamp=1668091476")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "36",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and not ok result with an error message if there are no blocks before the timestamp", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&closest=before&timestamp=1636548260")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Error! No closest block found",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and not ok result with an error message if there are no blocks after the timestamp", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&closest=after&timestamp=1670683476")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Error! No closest block found",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 with the last block number result if timestamp is larger than the timestamp of the latest block", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&closest=before&timestamp=1670683476")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "39",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 with the first block number result if timestamp is less than the timestamp of the first block", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&closest=after&timestamp=1636548260")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "10",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 with the found block number result for the existing block using default closest param value if not specified", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&timestamp=1668091476")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: "36",
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and invalid status with an error for timestamp less than zero", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&timestamp=-1")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Error! Invalid parameter",
            status: "0",
          })
        );
    });

    it("returns HTTP 200 and invalid status with an error for timestamp more than 9999999999", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&timestamp=10000000000")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Error! Invalid parameter",
            status: "0",
          })
        );
    });

    it("returns HTTP 200 and invalid status with an error for closest param different from before or after", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblocknobytime&closest=before123&timestamp=1668091476")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Error! Invalid parameter",
            status: "0",
          })
        );
    });
  });

  describe("/api?module=block&action=getblockcountdown", () => {
    it("returns HTTP 200 with the OK status and found block countdown result", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblockcountdown&blockno=50")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: {
              CurrentBlock: "39",
              CountdownBlock: "50",
              RemainingBlock: "11",
              EstimateTimeInSec: "11",
            },
          })
        );
    });

    it("returns HTTP 200 with the NOTOK status and error if block number has already passed", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblockcountdown&blockno=20")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "NOTOK",
            result: "Error! Block number already pass",
            status: "0",
          })
        );
    });
  });

  describe("/api?module=block&action=getblockreward", () => {
    it("returns HTTP 200 with the OK status and block rewards result", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblockreward&blockno=30")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: {
              blockMiner: "0x0000000000000000000000000000000000000000",
              blockNumber: "30",
              blockReward: "0",
              timeStamp: "1668091470",
              uncleInclusionReward: "0",
              uncles: [],
            },
            status: "1",
          })
        );
    });

    it("returns HTTP 200 with the NOTOK status and error that record does not exist for non existing block", () => {
      return request(app.getHttpServer())
        .get("/api?module=block&action=getblockreward&blockno=50")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "No record found",
            result: {
              blockMiner: null,
              blockNumber: null,
              blockReward: null,
              timeStamp: null,
              uncleInclusionReward: null,
              uncles: null,
            },
            status: "0",
          })
        );
    });
  });
});
