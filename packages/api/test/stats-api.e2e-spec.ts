import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";
import { BatchDetails } from "../src/batch/batchDetails.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Token, ETH_TOKEN } from "../src/token/token.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

describe("Stats API (e2e)", () => {
  let app: INestApplication;
  let blockRepository: Repository<BlockDetails>;
  let batchRepository: Repository<BatchDetails>;
  let tokenRepository: Repository<Token>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));
    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));

    await batchRepository.insert({
      number: 0,
      timestamp: new Date(),
      l1TxCount: 10,
      l2TxCount: 20,
      l1GasPrice: "10000000",
      l2FairGasPrice: "20000000",
      commitTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e21",
      proveTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e22",
      executeTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e23",
    });

    await blockRepository.insert({
      number: 0,
      hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      timestamp: new Date(),
      gasLimit: "0",
      gasUsed: "0",
      baseFeePerGas: "100000000",
      extraData: "0x",
      l1TxCount: 1,
      l2TxCount: 1,
      l1BatchNumber: 0,
      miner: "0x0000000000000000000000000000000000000000",
    });

    await tokenRepository.insert({
      l2Address: ETH_TOKEN.l2Address,
      l1Address: ETH_TOKEN.l1Address,
      symbol: ETH_TOKEN.symbol,
      name: ETH_TOKEN.name,
      decimals: ETH_TOKEN.decimals,
      blockNumber: 0,
      logIndex: 0,
      usdPrice: ETH_TOKEN.usdPrice,
      liquidity: ETH_TOKEN.liquidity,
      iconURL: ETH_TOKEN.iconURL,
      offChainDataUpdatedAt: new Date("2023-03-03"),
    });
  });

  afterAll(async () => {
    await tokenRepository.delete({});
    await blockRepository.delete({});
    await batchRepository.delete({});
    await app.close();
  });

  describe("/api?module=stats&action=ethprice GET", () => {
    it("returns HTTP 200 and ETH price", () => {
      return request(app.getHttpServer())
        .get(`/api?module=stats&action=ethprice`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: {
              ethusd: ETH_TOKEN.usdPrice.toString(),
              ethusd_timestamp: Math.floor(new Date("2023-03-03").getTime() / 1000).toString(),
            },
            status: "1",
          })
        );
    });
  });
});
