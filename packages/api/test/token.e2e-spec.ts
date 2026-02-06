import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { Token, TokenType } from "../src/token/token.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { Transfer, TransferType } from "../src/transfer/transfer.entity";
import { baseToken } from "../src/config";

describe("TokenController (e2e)", () => {
  let ETH_TOKEN;
  let app: INestApplication;
  let tokenRepository: Repository<Token>;
  let blockRepository: Repository<BlockDetails>;
  let transactionRepository: Repository<Transaction>;
  let transferRepository: Repository<Transfer>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    }).compile();
    ETH_TOKEN = baseToken;
    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    transferRepository = app.get<Repository<Transfer>>(getRepositoryToken(Transfer));

    await blockRepository.insert({
      number: 1,
      hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      timestamp: new Date("2022-11-10T14:44:08.000Z"),
      gasLimit: "0",
      gasUsed: "0",
      baseFeePerGas: "100000000",
      extraData: "0x",
      l1TxCount: 10,
      l2TxCount: 20,
      miner: "0x0000000000000000000000000000000000000000",
    });

    await transactionRepository.insert({
      hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      transactionIndex: 3233097,
      data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
      value: "0x2386f26fc10000",
      fee: "0x2386f26fc10000",
      nonce: 42,
      blockNumber: 1,
      blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      receivedAt: "2022-11-21T18:16:51.000Z",
      isL1Originated: true,
      receiptStatus: 1,
      gasLimit: "1000000",
      gasPrice: "100",
      type: 255,
    });

    let tokenIndex = 0;
    let transferIndex = 0;

    await tokenRepository.insert({
      l2Address: ETH_TOKEN.l2Address,
      l1Address: ETH_TOKEN.l1Address,
      symbol: ETH_TOKEN.symbol,
      name: ETH_TOKEN.name,
      decimals: ETH_TOKEN.decimals,
      blockNumber: 0,
      logIndex: 0,
    });

    for (let i = 1; i <= 30; i++) {
      await tokenRepository.insert({
        l1Address: i % 2 != 0 ? `0xf754ff5e8a6f257e162f72578a4bb0493c0681${i < 10 ? "0" : ""}${i}` : null,
        l2Address: `0xd754ff5e8a6f257e162f72578a4bb0493c0681${i < 10 ? "0" : ""}${i}`,
        symbol: `TEST${i}`,
        name: `TEST token ${i}`,
        decimals: 18,
        blockNumber: 1,
        logIndex: tokenIndex++,
      });
    }

    for (let i = 1; i <= 3; i++) {
      await transferRepository.insert({
        from: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: "1000",
        type: TransferType.Deposit,
        tokenType: TokenType.ERC20,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: false,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        to: "0x0000000000000000000000000000000000008001",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: "1000",
        type: TransferType.Fee,
        tokenType: TokenType.ERC20,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: true,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: "1000",
        type: TransferType.Mint,
        tokenType: TokenType.ERC20,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: false,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        to: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: "1000",
        type: TransferType.Transfer,
        tokenType: TokenType.ERC20,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: false,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: "1000",
        type: TransferType.Withdrawal,
        tokenType: TokenType.ERC20,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: false,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: undefined,
        type: TransferType.Mint,
        tokenType: TokenType.ERC721,
        fields: { tokenId: "1" },
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: false,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x0000000000000000000000000000000000008001",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
        amount: "1000",
        type: TransferType.Refund,
        tokenType: TokenType.ERC20,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: true,
        isInternal: false,
      });

      await transferRepository.insert({
        from: "0x0000000000000000000000000000000000008001",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fe",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress: "0x000000000000000000000000000000000000800A",
        amount: "1000",
        type: TransferType.Refund,
        tokenType: TokenType.BaseToken,
        logIndex: transferIndex++,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:51.000Z",
        isFeeOrRefund: false,
        isInternal: false,
      });
    }
  });

  afterAll(async () => {
    await transferRepository.createQueryBuilder().delete().execute();
    await tokenRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();

    await app.close();
  });

  describe("/tokens/:address GET", () => {
    it("returns HTTP 200 and the token for an existing token address", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
            l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
            symbol: "TEST1",
            name: "TEST token 1",
            decimals: 18,
            iconURL: null,
            liquidity: null,
            usdPrice: null,
          })
        );
    });

    it("returns HTTP 200 and the token for an existing token address specified with the upper case letters", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xD754FF5E8A6F257E162F72578A4BB0493C068101")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
            l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
            symbol: "TEST1",
            name: "TEST token 1",
            decimals: 18,
            iconURL: null,
            liquidity: null,
            usdPrice: null,
          })
        );
    });

    it("returns HTTP 200 and the token for an existing token address without 0x", () => {
      return request(app.getHttpServer())
        .get("/tokens/D754FF5E8A6F257E162F72578A4BB0493C068101")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
            l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
            symbol: "TEST1",
            name: "TEST token 1",
            decimals: 18,
            iconURL: null,
            liquidity: null,
            usdPrice: null,
          })
        );
    });

    it("returns HTTP 200 and ETH token even if it does not exist in DB", () => {
      return request(app.getHttpServer())
        .get("/tokens/0x000000000000000000000000000000000000800a")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            l2Address: "0x000000000000000000000000000000000000800A",
            l1Address: "0x0000000000000000000000000000000000000000",
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            iconURL: null,
            liquidity: null,
            usdPrice: null,
          })
        );
    });

    it("returns HTTP 400 for not valid token address", () => {
      return request(app.getHttpServer()).get("/tokens/invalidAddressParam").expect(400);
    });

    it("returns HTTP 400 if an address starts with 0X (in upper case)", () => {
      return request(app.getHttpServer()).get("/tokens/0XD754FF5E8a6F257E162f72578a4bB0493c068101").expect(400);
    });

    it("returns HTTP 404 if the token with the specified address does not exist", () => {
      return request(app.getHttpServer()).get("/tokens/0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").expect(404);
    });
  });

  describe("/tokens GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/tokens")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and tokens for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/tokens?page=2&limit=2")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              l1Address: null,
              l2Address: "0xd754Ff5e8A6F257e162f72578A4BB0493c068128",
              name: "TEST token 28",
              symbol: "TEST28",
              decimals: 18,
              iconURL: null,
              liquidity: null,
              usdPrice: null,
            },
            {
              l1Address: "0xF754ff5E8a6F257E162f72578A4bB0493C068127",
              l2Address: "0xd754ff5e8a6f257e162f72578a4bb0493c068127",
              name: "TEST token 27",
              symbol: "TEST27",
              decimals: 18,
              iconURL: null,
              liquidity: null,
              usdPrice: null,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata", () => {
      return request(app.getHttpServer())
        .get("/tokens?page=2&limit=5")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toStrictEqual({
            currentPage: 2,
            itemCount: 5,
            itemsPerPage: 5,
            totalItems: 15,
            totalPages: 3,
          })
        );
    });

    it("returns HTTP 200 and populated paging links", () => {
      return request(app.getHttpServer())
        .get("/tokens?page=2&limit=5")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first: "tokens?limit=5",
            last: "tokens?page=3&limit=5",
            next: "tokens?page=3&limit=5",
            previous: "tokens?page=1&limit=5",
          })
        );
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer()).get("/tokens?page=0").expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer()).get("/tokens?limit=0").expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer()).get("/tokens?limit=101").expect(400);
    });
  });

  describe("/tokens/:address/transfers GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and token transfers for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=2&limit=7")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              amount: "1000",
              blockNumber: 1,
              fields: null,
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "transfer",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: "1000",
              blockNumber: 1,
              fields: null,
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "withdrawal",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: null,
              blockNumber: 1,
              fields: {
                tokenId: "1",
              },
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "mint",
              tokenType: "ERC721",
              isInternal: false,
            },
            {
              amount: "1000",
              blockNumber: 1,
              fields: null,
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "deposit",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: "1000",
              blockNumber: 1,
              fields: null,
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "mint",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: "1000",
              blockNumber: 1,
              fields: null,
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0xd754Ff5e8a6f257E162F72578A4bB0493c0681d8",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "transfer",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: "1000",
              blockNumber: 1,
              fields: null,
              from: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token 1",
                symbol: "TEST1",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "withdrawal",
              tokenType: "ERC20",
              isInternal: false,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=2&limit=7")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toStrictEqual({
            currentPage: 2,
            itemCount: 7,
            itemsPerPage: 7,
            totalItems: 15,
            totalPages: 3,
          })
        );
    });

    it("returns HTTP 200 and populated paging links", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=2&limit=7")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first: "tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?limit=7",
            last: "tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=3&limit=7",
            next: "tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=3&limit=7",
            previous: "tokens/0xd754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=1&limit=7",
          })
        );
    });

    it("returns HTTP 200 and transfers for ETH token even if it is not in DB", () => {
      return request(app.getHttpServer())
        .get("/tokens/0x000000000000000000000000000000000000800a/transfers?page=1&limit=7")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                amount: "1000",
                blockNumber: 1,
                fields: null,
                from: "0x0000000000000000000000000000000000008001",
                isInternal: false,
                timestamp: "2022-11-21T18:16:51.000Z",
                to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
                token: {
                  decimals: 18,
                  l1Address: "0x0000000000000000000000000000000000000000",
                  l2Address: "0x000000000000000000000000000000000000800A",
                  name: "Ether",
                  symbol: "ETH",
                  iconURL: null,
                  liquidity: null,
                  usdPrice: null,
                },
                tokenAddress: "0x000000000000000000000000000000000000800A",
                tokenType: "BASETOKEN",
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
                type: "refund",
              },
              {
                amount: "1000",
                blockNumber: 1,
                fields: null,
                from: "0x0000000000000000000000000000000000008001",
                isInternal: false,
                timestamp: "2022-11-21T18:16:51.000Z",
                to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
                token: {
                  decimals: 18,
                  l1Address: "0x0000000000000000000000000000000000000000",
                  l2Address: "0x000000000000000000000000000000000000800A",
                  name: "Ether",
                  symbol: "ETH",
                  iconURL: null,
                  liquidity: null,
                  usdPrice: null,
                },
                tokenAddress: "0x000000000000000000000000000000000000800A",
                tokenType: "BASETOKEN",
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
                type: "refund",
              },
              {
                amount: "1000",
                blockNumber: 1,
                fields: null,
                from: "0x0000000000000000000000000000000000008001",
                isInternal: false,
                timestamp: "2022-11-21T18:16:51.000Z",
                to: "0x52312AD6f01657413b2eaE9287f6B9ADaD93D5FE",
                token: {
                  decimals: 18,
                  l1Address: "0x0000000000000000000000000000000000000000",
                  l2Address: "0x000000000000000000000000000000000000800A",
                  name: "Ether",
                  symbol: "ETH",
                  iconURL: null,
                  liquidity: null,
                  usdPrice: null,
                },
                tokenAddress: "0x000000000000000000000000000000000000800A",
                tokenType: "BASETOKEN",
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
                type: "refund",
              },
            ],
            links: {
              first: "tokens/0x000000000000000000000000000000000000800a/transfers?limit=7",
              last: "tokens/0x000000000000000000000000000000000000800a/transfers?page=1&limit=7",
              next: "",
              previous: "",
            },
            meta: {
              currentPage: 1,
              itemCount: 3,
              itemsPerPage: 7,
              totalItems: 3,
              totalPages: 1,
            },
          })
        );
    });

    it("returns HTTP 400 for not valid token address", () => {
      return request(app.getHttpServer()).get("/tokens/invalidAddressParam/transfers").expect(400);
    });

    it("returns HTTP 400 if an address starts with 0X (in upper case)", () => {
      return request(app.getHttpServer())
        .get("/tokens/0XD754FF5E8a6F257E162f72578a4bB0493c068101/transfers")
        .expect(400);
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xf754ff5e8a6f257e162f72578a4bb0493c068101/transfers?page=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xf754ff5e8a6f257e162f72578a4bb0493c068101/transfers?limit=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xf754ff5e8a6f257e162f72578a4bb0493c068101/transfers?limit=101")
        .expect(400);
    });

    it("returns HTTP 400 if older items than first 100_000 are requested", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xf754ff5e8a6f257e162f72578a4bb0493c068101/transfers?limit=100&page=1001")
        .expect(400);
    });

    it("returns HTTP 404 if the token with the specified address does not exist", () => {
      return request(app.getHttpServer())
        .get("/tokens/0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF/transfers")
        .expect(404);
    });
  });
});
