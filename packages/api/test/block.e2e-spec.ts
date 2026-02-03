import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { BlockStatus } from "../src/block/block.entity";

describe("BlockController (e2e)", () => {
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
        status: BlockStatus.Executed,
      });
    }
  });

  afterAll(async () => {
    await blockRepository.createQueryBuilder().delete().execute();

    await app.close();
  });

  describe("/blocks/:blockNumber GET", () => {
    it("returns HTTP 200 and the block for an existing block number", () => {
      return request(app.getHttpServer())
        .get("/blocks/10")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            number: 10,
            hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            parentHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            timestamp: "2022-11-10T14:44:10.000Z",
            gasLimit: "0",
            gasUsed: "0",
            baseFeePerGas: "100000000",
            extraData: "0x1231",
            status: "executed",
            l1TxCount: 100,
            l2TxCount: 200,
            size: 300,
          })
        );
    });

    it("returns HTTP 400 if block number is not a number", () => {
      return request(app.getHttpServer()).get("/blocks/abc").expect(400);
    });

    it("returns HTTP 400 if block number is a negative number", () => {
      return request(app.getHttpServer()).get("/blocks/-1").expect(400);
    });

    it("returns HTTP 400 if block number is greater than max int number", () => {
      return request(app.getHttpServer()).get("/blocks/9007199254740992").expect(400);
    });

    it("returns HTTP 404 if the block with the specified blockNumber does not exist", () => {
      return request(app.getHttpServer()).get("/blocks/41").expect(404);
    });
  });

  describe("/blocks GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/blocks")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and blocks for the specified paging configuration and only toDate filter specified", () => {
      return request(app.getHttpServer())
        .get("/blocks?page=2&limit=2&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                gasUsed: "0",
                hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                l1TxCount: 360,
                l2TxCount: 720,
                number: 36,
                size: 1080,
                status: "executed",
                timestamp: "2022-11-10T14:44:36.000Z",
              },
              {
                gasUsed: "0",
                hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                l1TxCount: 350,
                l2TxCount: 700,
                number: 35,
                size: 1050,
                status: "executed",
                timestamp: "2022-11-10T14:44:35.000Z",
              },
            ],
            links: {
              first: "blocks?limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
              last: "blocks?page=15&limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
              next: "blocks?page=3&limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
              previous: "blocks?page=1&limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
            },
            meta: {
              currentPage: 2,
              itemCount: 2,
              itemsPerPage: 2,
              totalItems: 29,
              totalPages: 15,
            },
          })
        );
    });

    it("returns HTTP 200 and blocks for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/blocks?page=2&limit=2&fromDate=2022-11-10T14:44:17.000Z&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              number: 36,
              hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              timestamp: "2022-11-10T14:44:36.000Z",
              gasUsed: "0",
              l1TxCount: 360,
              l2TxCount: 720,
              size: 1080,
              status: "executed",
            },
            {
              number: 35,
              hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              timestamp: "2022-11-10T14:44:35.000Z",
              gasUsed: "0",
              l1TxCount: 350,
              l2TxCount: 700,
              size: 1050,
              status: "executed",
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata", () => {
      return request(app.getHttpServer())
        .get("/blocks?page=2&limit=10&fromDate=2022-11-10T14:44:17.000Z&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 2,
            itemCount: 10,
            itemsPerPage: 10,
            totalItems: 22,
            totalPages: 3,
          })
        );
    });

    it("returns HTTP 200 and populated paging links", () => {
      return request(app.getHttpServer())
        .get("/blocks?page=2&limit=10&fromDate=2022-11-10T14:44:17.000Z&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toMatchObject({
            first: "blocks?limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
            last: "blocks?page=3&limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
            next: "blocks?page=3&limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
            previous:
              "blocks?page=1&limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
          })
        );
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer()).get("/blocks?page=0").expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer()).get("/blocks?limit=0").expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer()).get("/blocks?limit=101").expect(400);
    });

    it("returns HTTP 400 if toDate is not a valid ISO date", () => {
      return request(app.getHttpServer()).get("/blocks?toDate=20000107").expect(400);
    });

    it("returns HTTP 400 if fromDate is not a valid ISO date", () => {
      return request(app.getHttpServer()).get("/blocks?fromDate=20000107").expect(400);
    });
  });
});
