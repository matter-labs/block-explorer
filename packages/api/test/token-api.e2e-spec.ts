import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { Repository } from "typeorm";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Token } from "../src/token/token.entity";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { baseToken } from "../src/config";

describe("Token API (e2e)", () => {
  let app: INestApplication;
  let blockRepository: Repository<BlockDetails>;
  let tokenRepository: Repository<Token>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));

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
      miner: "0x0000000000000000000000000000000000000000",
    });

    await tokenRepository.insert({
      l2Address: baseToken.l2Address,
      l1Address: baseToken.l1Address,
      symbol: baseToken.symbol,
      name: baseToken.name,
      decimals: baseToken.decimals,
      blockNumber: 0,
      logIndex: 0,
      usdPrice: baseToken.usdPrice,
      liquidity: baseToken.liquidity,
      iconURL: baseToken.iconURL,
    });

    await tokenRepository.insert({
      l2Address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
      l1Address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68",
      symbol: "TKN",
      name: "Token",
      decimals: 6,
      blockNumber: 0,
      logIndex: 1,
      usdPrice: 123.456,
      liquidity: 1000000,
      iconURL: "http://token.url",
    });
  });

  afterAll(async () => {
    await tokenRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe("/api?module=token&action=tokenInfo GET", () => {
    it("returns HTTP 200 and no data found response when no token is found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=token&action=tokeninfo&contractaddress=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb66`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "No data found",
            result: [],
          })
        );
    });

    it("returns HTTP 200 and token info when token is found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=token&action=tokeninfo&contractaddress=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                contractAddress: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
                iconURL: "http://token.url",
                l1Address: "0x91d0A23f34E535E44Df8Ba84c53a0945Cf0eEb68",
                liquidity: "1000000",
                symbol: "TKN",
                tokenDecimal: "6",
                tokenName: "Token",
                tokenPriceUSD: "123.456",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and ETH token info for ETH token", () => {
      return request(app.getHttpServer())
        .get(`/api?module=token&action=tokeninfo&contractaddress=${baseToken.l2Address}`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                contractAddress: baseToken.l2Address,
                iconURL: baseToken.iconURL,
                l1Address: baseToken.l1Address,
                liquidity: baseToken.liquidity.toString(),
                symbol: baseToken.symbol,
                tokenDecimal: baseToken.decimals.toString(),
                tokenName: baseToken.name,
                tokenPriceUSD: baseToken.usdPrice.toString(),
              },
            ],
            status: "1",
          })
        );
    });
  });
});
