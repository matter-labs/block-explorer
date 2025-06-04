import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { BatchDetails } from "../src/batch/batchDetails.entity";
import { BatchStatus } from "../src/batch/batch.entity";

describe("BatchController (e2e)", () => {
  let app: INestApplication;
  let batchRepository: Repository<BatchDetails>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));

    for (let i = 0; i < 40; i++) {
      const isCommitted = i < 30;
      const isProven = i < 20;
      const isExecuted = i < 10;
      await batchRepository.insert({
        number: i,
        rootHash: `0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a36${(0 + i.toString()).slice(-2)}`,
        timestamp: new Date(`2022-11-10T14:44:${(0 + i.toString()).slice(-2)}.000Z`),
        l1GasPrice: "10000000",
        l2FairGasPrice: "20000000",
        l1TxCount: 1,
        l2TxCount: 2,
        commitTxHash: isCommitted ? "0x546b26df0927cd01611e41b136b35317a991597ed7a01843b5f47460a3549a2b" : null,
        proveTxHash: isProven ? "0x253d496e6dc5a019f12a2b560798a222657f37f4da29dafcd100ba97c79baddc" : null,
        executeTxHash: isExecuted ? "0xebbe54f44eb960094264315bbddf468871e489abbd4d9af9e3bd96e38f08ddab" : null,
        committedAt: isCommitted ? new Date("2022-11-10T14:44:06.000Z") : null,
        provenAt: isProven ? new Date("2022-11-10T14:44:07.000Z") : null,
        executedAt: isExecuted ? new Date("2022-11-10T14:44:08.000Z") : null,
      });
    }
  });

  afterAll(async () => {
    await batchRepository.delete({});

    await app.close();
  });

  describe("/batches/:batchNumber GET", () => {
    it("returns HTTP 200 and batch details with specified number in response body when it exists", () => {
      return request(app.getHttpServer())
        .get("/batches/1")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            number: 1,
            rootHash: "0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3601",
            timestamp: "2022-11-10T14:44:01.000Z",
            l1GasPrice: "10000000",
            l2FairGasPrice: "20000000",
            l1TxCount: 1,
            l2TxCount: 2,
            size: 3,
            status: BatchStatus.Verified,
            commitTxHash: "0x546b26df0927cd01611e41b136b35317a991597ed7a01843b5f47460a3549a2b",
            proveTxHash: "0x253d496e6dc5a019f12a2b560798a222657f37f4da29dafcd100ba97c79baddc",
            executeTxHash: "0xebbe54f44eb960094264315bbddf468871e489abbd4d9af9e3bd96e38f08ddab",
            committedAt: "2022-11-10T14:44:06.000Z",
            provenAt: "2022-11-10T14:44:07.000Z",
            executedAt: "2022-11-10T14:44:08.000Z",
          })
        );
    });

    it("returns executed batch specific details", () => {
      return request(app.getHttpServer())
        .get("/batches/2")
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            status: BatchStatus.Verified,
            commitTxHash: "0x546b26df0927cd01611e41b136b35317a991597ed7a01843b5f47460a3549a2b",
            proveTxHash: "0x253d496e6dc5a019f12a2b560798a222657f37f4da29dafcd100ba97c79baddc",
            executeTxHash: "0xebbe54f44eb960094264315bbddf468871e489abbd4d9af9e3bd96e38f08ddab",
            committedAt: "2022-11-10T14:44:06.000Z",
            provenAt: "2022-11-10T14:44:07.000Z",
            executedAt: "2022-11-10T14:44:08.000Z",
          })
        );
    });

    it("returns proven batch specific details", () => {
      return request(app.getHttpServer())
        .get("/batches/11")
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            status: BatchStatus.Sealed,
            commitTxHash: "0x546b26df0927cd01611e41b136b35317a991597ed7a01843b5f47460a3549a2b",
            proveTxHash: "0x253d496e6dc5a019f12a2b560798a222657f37f4da29dafcd100ba97c79baddc",
            executeTxHash: null,
            committedAt: "2022-11-10T14:44:06.000Z",
            provenAt: "2022-11-10T14:44:07.000Z",
            executedAt: null,
          })
        );
    });

    it("returns committed batch specific details", () => {
      return request(app.getHttpServer())
        .get("/batches/21")
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            status: BatchStatus.Sealed,
            commitTxHash: "0x546b26df0927cd01611e41b136b35317a991597ed7a01843b5f47460a3549a2b",
            proveTxHash: null,
            executeTxHash: null,
            committedAt: "2022-11-10T14:44:06.000Z",
            provenAt: null,
            executedAt: null,
          })
        );
    });

    it("returns new batch specific details", () => {
      return request(app.getHttpServer())
        .get("/batches/31")
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            status: BatchStatus.Sealed,
            commitTxHash: null,
            proveTxHash: null,
            executeTxHash: null,
            committedAt: null,
            provenAt: null,
            executedAt: null,
          })
        );
    });

    it("returns HTTP 400 if batch number is not a number", () => {
      return request(app.getHttpServer()).get("/batches/abc").expect(400);
    });

    it("returns HTTP 400 if batch number is a negative number", () => {
      return request(app.getHttpServer()).get("/batches/-1").expect(400);
    });

    it("returns HTTP 400 if batch number is greater than max int number", () => {
      return request(app.getHttpServer()).get("/batches/9007199254740992").expect(400);
    });

    it("returns HTTP 404 if the batch with the specified batchNumber does not exist", () => {
      return request(app.getHttpServer()).get("/batches/41").expect(404);
    });
  });

  describe("/batches GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/batches")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and batches for the specified paging configuration and only toDate filter specified", () => {
      return request(app.getHttpServer())
        .get("/batches?page=2&limit=2&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                executedAt: null,
                l1TxCount: 1,
                l2TxCount: 2,
                number: 36,
                rootHash: "0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3636",
                size: 3,
                status: "sealed",
                timestamp: "2022-11-10T14:44:36.000Z",
              },
              {
                executedAt: null,
                l1TxCount: 1,
                l2TxCount: 2,
                number: 35,
                rootHash: "0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3635",
                size: 3,
                status: "sealed",
                timestamp: "2022-11-10T14:44:35.000Z",
              },
            ],
            links: {
              first: "batches?limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
              last: "batches?page=20&limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
              next: "batches?page=3&limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
              previous: "batches?page=1&limit=2&toDate=2022-11-10T14%3A44%3A38.000Z",
            },
            meta: {
              currentPage: 2,
              itemCount: 2,
              itemsPerPage: 2,
              totalItems: 39,
              totalPages: 20,
            },
          })
        );
    });

    it("returns HTTP 200 and batches for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/batches?page=2&limit=2&fromDate=2022-11-10T14:44:17.000Z&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              number: 36,
              rootHash: "0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3636",
              timestamp: "2022-11-10T14:44:36.000Z",
              l1TxCount: 1,
              l2TxCount: 2,
              size: 3,
              status: BatchStatus.Sealed,
              executedAt: null,
            },
            {
              number: 35,
              rootHash: "0x1915069f839c80d8bf1df2ba08dc41fbca1fcae62ecf3a148dda013d520a3635",
              timestamp: "2022-11-10T14:44:35.000Z",
              l1TxCount: 1,
              l2TxCount: 2,
              size: 3,
              status: BatchStatus.Sealed,
              executedAt: null,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata", () => {
      return request(app.getHttpServer())
        .get("/batches?page=2&limit=10&fromDate=2022-11-10T14:44:17.000Z&toDate=2022-11-10T14:44:38.000Z")
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
        .get("/batches?page=2&limit=10&fromDate=2022-11-10T14:44:17.000Z&toDate=2022-11-10T14:44:38.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toMatchObject({
            first: "batches?limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
            last: "batches?page=3&limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
            next: "batches?page=3&limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
            previous:
              "batches?page=1&limit=10&fromDate=2022-11-10T14%3A44%3A17.000Z&toDate=2022-11-10T14%3A44%3A38.000Z",
          })
        );
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer()).get("/batches?page=0").expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer()).get("/batches?limit=0").expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer()).get("/batches?limit=101").expect(400);
    });

    it("returns HTTP 400 if toDate is not a valid ISO date", () => {
      return request(app.getHttpServer()).get("/batches?toDate=20000107").expect(400);
    });

    it("returns HTTP 400 if fromDate is not a valid ISO date", () => {
      return request(app.getHttpServer()).get("/batches?fromDate=20000107").expect(400);
    });
  });
});
