import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { Address } from "../src/address/address.entity";
import { Balance } from "../src/balance/balance.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { BlockStatus } from "../src/block/block.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { AddressTransaction } from "../src/transaction/entities/addressTransaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { Log } from "../src/log/log.entity";
import { Token, TokenType } from "../src/token/token.entity";
import { Counter } from "../src/counter/counter.entity";
import { Transfer, TransferType } from "../src/transfer/transfer.entity";
import { AddressTransfer } from "../src/transfer/addressTransfer.entity";
import { baseToken } from "../src/config";

describe("AddressController (e2e)", () => {
  const ETH_TOKEN = baseToken;
  let app: INestApplication;
  let addressRepository: Repository<Address>;
  let blockRepository: Repository<BlockDetails>;
  let transactionRepository: Repository<Transaction>;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let logRepository: Repository<Log>;
  let tokenRepository: Repository<Token>;
  let balanceRepository: Repository<Balance>;
  let counterRepository: Repository<Counter>;
  let transferRepository: Repository<Transfer>;
  let addressTransferRepository: Repository<AddressTransfer>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    addressRepository = app.get<Repository<Address>>(getRepositoryToken(Address));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transactionReceiptRepository = app.get<Repository<TransactionReceipt>>(getRepositoryToken(TransactionReceipt));
    logRepository = app.get<Repository<Log>>(getRepositoryToken(Log));
    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));
    balanceRepository = app.get<Repository<Balance>>(getRepositoryToken(Balance));
    counterRepository = app.get<Repository<Counter>>(getRepositoryToken(Counter));
    transferRepository = app.get<Repository<Transfer>>(getRepositoryToken(Transfer));
    addressTransferRepository = app.get<Repository<AddressTransfer>>(getRepositoryToken(AddressTransfer));

    for (let i = 1; i <= 5; i++) {
      await blockRepository.insert({
        number: i,
        hash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ace",
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        gasLimit: "0",
        gasUsed: "0",
        baseFeePerGas: "0",
        extraData: "0x",
        l1TxCount: 1,
        l2TxCount: 1,
        miner: "0x0000000000000000000000000000000000000000",
        status: BlockStatus.Executed,
      });
    }

    for (let i = 1; i < 10; i++) {
      const transactionSpec = {
        hash: `0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e1${i}`,
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        from: i < 7 ? "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67" : "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        transactionIndex: 3233097 + i,
        data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
        value: "0x2386f26fc10000",
        fee: "0x2386f26fc10000",
        nonce: 42 + i,
        blockNumber: i < 6 ? i : 5,
        blockHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ace",
        receivedAt: "2022-11-21T18:16:51.000Z",
        isL1Originated: i > 4,
        receiptStatus: 1,
        gasLimit: "1000000",
        gasPrice: "100",
        type: 255,
      };

      await transactionRepository.insert(transactionSpec);

      for (const address of new Set([transactionSpec.from, transactionSpec.to])) {
        await addressTransactionRepository.insert({
          transactionHash: transactionSpec.hash,
          address,
          blockNumber: transactionSpec.blockNumber,
          receivedAt: transactionSpec.receivedAt,
          transactionIndex: transactionSpec.transactionIndex,
        });
      }
    }

    for (let i = 1; i < 10; i++) {
      await transactionReceiptRepository.insert({
        transactionHash: `0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e1${i}`,
        from: `0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35${i}`,
        status: 1,
        gasUsed: "900000",
        cumulativeGasUsed: "1100000",
        contractAddress:
          i <= 4 ? "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68" : "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69",
      });
    }

    await counterRepository.insert({
      tableName: "transactions",
      queryString: "from%7Cto=0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68",
      count: 4,
    });

    // account address
    await addressRepository.insert({
      address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
      bytecode: "0x",
    });

    await tokenRepository.insert({
      l2Address: ETH_TOKEN.l2Address,
      l1Address: ETH_TOKEN.l1Address,
      symbol: ETH_TOKEN.symbol,
      name: ETH_TOKEN.name,
      decimals: ETH_TOKEN.decimals,
      blockNumber: 0,
      logIndex: 0,
    });

    // tokens for balances
    for (let i = 0; i <= 9; i++) {
      await tokenRepository.insert({
        l2Address: `0x9488fc54fccc6f319d4863ddc2c2899ed35d895${i}`,
        l1Address: `0x9488fc54fccc6f319d4863ddc2c2899ed35d895${i}`,
        name: `TEST ${i}`,
        symbol: `TEST ${i}`,
        decimals: 18,
        blockNumber: 1,
        logIndex: 0,
      });
    }

    // account balances
    for (let i = 10; i <= 100; i += 10) {
      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8954",
        blockNumber: i + 1,
        balance: (123 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8955",
        blockNumber: i + 2,
        balance: (234 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8956",
        blockNumber: i + 3,
        balance: (345 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
        tokenAddress: "0x000000000000000000000000000000000000800A",
        blockNumber: i + 3,
        balance: (345 * i).toString(),
      });
    }

    // balances without address record
    for (let i = 10; i <= 100; i += 10) {
      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb71",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8954",
        blockNumber: i + 1,
        balance: (123 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb71",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8955",
        blockNumber: i + 2,
        balance: (234 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb71",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8956",
        blockNumber: i + 3,
        balance: (345 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb71",
        tokenAddress: "0x000000000000000000000000000000000000800A",
        blockNumber: i + 3,
        balance: (345 * i).toString(),
      });
    }

    // contract address
    await addressRepository.insert({
      address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68",
      bytecode: "0x000012",
      createdInBlockNumber: 10,
      creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
      creatorAddress: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb60",
    });

    // contract balances
    for (let i = 10; i <= 100; i += 10) {
      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8957",
        blockNumber: i + 4,
        balance: (456 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8958",
        blockNumber: i + 5,
        balance: (567 * i).toString(),
      });

      await balanceRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68",
        tokenAddress: "0x9488fc54fccc6f319d4863ddc2c2899ed35d8959",
        blockNumber: i + 6,
        balance: (678 * i).toString(),
      });
    }

    // contract address with no balances
    await addressRepository.insert({
      address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb70",
      bytecode: "0x000012",
      createdInBlockNumber: 10,
      creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
      creatorAddress: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb60",
    });

    for (let i = 0; i < 20; i++) {
      await logRepository.insert({
        address: "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67",
        topics: [
          "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
          "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
          "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
          "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
        ],
        data: "0x",
        blockNumber: 1,
        transactionIndex: 1,
        logIndex: i + 1,
        timestamp: "2022-11-21T18:16:51.000Z",
      });
    }

    await tokenRepository.insert({
      l2Address: "0x97d0a23f34e535e44df8ba84c53a0945cf0eeb67",
      name: "TEST",
      symbol: "TST",
      decimals: 18,
      blockNumber: 1,
      logIndex: 0,
    });

    for (let i = 0; i < 30; i++) {
      let type = TransferType.Transfer;
      if (i % 6 === 1) {
        type = TransferType.Deposit;
      } else if (i % 6 === 2) {
        type = TransferType.Withdrawal;
      } else if (i % 6 === 3) {
        type = TransferType.Mint;
      } else if (i % 6 === 4) {
        type = TransferType.Fee;
      } else if (i % 6 === 5) {
        type = TransferType.Refund;
      }

      const transferSpec = {
        from: i < 15 ? "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67" : "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb60",
        to: i > 18 ? "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67" : "0x91d0a23f34e535e44df8ba84c53a0945cf0eeb60",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
        transactionIndex: i,
        timestamp: new Date("2022-11-21T18:16:51.000Z"),
        type,
        tokenType: i % 2 ? TokenType.ERC20 : TokenType.BaseToken,
        tokenAddress:
          i % 2 ? "0x97d0a23f34e535e44df8ba84c53a0945cf0eeb67" : "0x000000000000000000000000000000000000800a",
        logIndex: i,
        isFeeOrRefund: type === TransferType.Fee || type === TransferType.Refund,
        isInternal: false,
      };

      const insertResult = await transferRepository.insert(transferSpec);

      for (const address of new Set([transferSpec.from, transferSpec.to])) {
        await addressTransferRepository.insert({
          transferNumber: Number(insertResult.identifiers[0].number),
          address,
          tokenAddress: transferSpec.tokenAddress,
          blockNumber: transferSpec.blockNumber,
          timestamp: transferSpec.timestamp,
          type: transferSpec.type,
          tokenType: transferSpec.tokenType,
          isFeeOrRefund: transferSpec.isFeeOrRefund,
          logIndex: transferSpec.logIndex,
          isInternal: transferSpec.isInternal,
        });
      }
    }
  });

  afterAll(async () => {
    await balanceRepository.createQueryBuilder().delete().execute();
    await logRepository.createQueryBuilder().delete().execute();
    await addressTransferRepository.createQueryBuilder().delete().execute();
    await transferRepository.createQueryBuilder().delete().execute();
    await addressRepository.createQueryBuilder().delete().execute();
    await tokenRepository.createQueryBuilder().delete().execute();
    await transactionReceiptRepository.createQueryBuilder().delete().execute();
    await addressTransactionRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();

    await app.close();
  });

  describe("/address/:address GET", () => {
    it("returns HTTP 200 and the account default response if the specified address does not exist", () => {
      return request(app.getHttpServer())
        .get("/address/0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            type: "account",
            address: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
            balances: {},
            blockNumber: 5,
            sealedNonce: 0,
            verifiedNonce: 0,
          })
        );
    });

    describe("when existing account address is requested", () => {
      it("returns HTTP 200 and the account address record", () => {
        return request(app.getHttpServer())
          .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              balances: {
                "0x000000000000000000000000000000000000800A": {
                  balance: "34500",
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
                },
                "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956": {
                  balance: "34500",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    l2Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    name: "TEST 6",
                    symbol: "TEST 6",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954": {
                  balance: "12300",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    l2Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    name: "TEST 4",
                    symbol: "TEST 4",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955": {
                  balance: "23400",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    l2Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    name: "TEST 5",
                    symbol: "TEST 5",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 103,
              sealedNonce: 47,
              type: "account",
              verifiedNonce: 47,
            })
          );
      });

      it("returns HTTP 200 and the account address record for an address specified with the upper case letters", () => {
        return request(app.getHttpServer())
          .get("/address/0x91D0A23F34E535E44DF8BA84C53A0945CF0EEB67")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              balances: {
                "0x000000000000000000000000000000000000800A": {
                  balance: "34500",
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
                },
                "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956": {
                  balance: "34500",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    l2Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    name: "TEST 6",
                    symbol: "TEST 6",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954": {
                  balance: "12300",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    l2Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    name: "TEST 4",
                    symbol: "TEST 4",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955": {
                  balance: "23400",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    l2Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    name: "TEST 5",
                    symbol: "TEST 5",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 103,
              sealedNonce: 47,
              type: "account",
              verifiedNonce: 47,
            })
          );
      });

      it("returns HTTP 200 and the account address record for not properly normalized address", () => {
        return request(app.getHttpServer())
          .get("/address/0x91D0a23f34E535e44df8ba84c53a0945cf0eeb67")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              balances: {
                "0x000000000000000000000000000000000000800A": {
                  balance: "34500",
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
                },
                "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956": {
                  balance: "34500",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    l2Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    name: "TEST 6",
                    symbol: "TEST 6",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954": {
                  balance: "12300",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    l2Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    name: "TEST 4",
                    symbol: "TEST 4",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955": {
                  balance: "23400",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    l2Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    name: "TEST 5",
                    symbol: "TEST 5",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 103,
              sealedNonce: 47,
              type: "account",
              verifiedNonce: 47,
            })
          );
      });

      it("returns HTTP 200 and the account address record for an address specified without 0x", () => {
        return request(app.getHttpServer())
          .get("/address/91d0a23f34e535e44df8ba84c53a0945cf0eeb67")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              balances: {
                "0x000000000000000000000000000000000000800A": {
                  balance: "34500",
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
                },
                "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956": {
                  balance: "34500",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    l2Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    name: "TEST 6",
                    symbol: "TEST 6",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954": {
                  balance: "12300",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    l2Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    name: "TEST 4",
                    symbol: "TEST 4",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955": {
                  balance: "23400",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    l2Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    name: "TEST 5",
                    symbol: "TEST 5",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 103,
              sealedNonce: 47,
              type: "account",
              verifiedNonce: 47,
            })
          );
      });
    });

    describe("when there is no address record for balances", () => {
      it("returns HTTP 200 and the account address record with balances and block number", () => {
        return request(app.getHttpServer())
          .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb71")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91d0A23F34e535E44dF8ba84c53a0945cf0EEB71",
              balances: {
                "0x000000000000000000000000000000000000800A": {
                  balance: "34500",
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
                },
                "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956": {
                  balance: "34500",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    l2Address: "0x9488FC54FcCc6f319D4863Ddc2c2899Ed35d8956",
                    name: "TEST 6",
                    symbol: "TEST 6",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954": {
                  balance: "12300",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    l2Address: "0x9488Fc54FCcC6f319d4863dDc2C2899ED35D8954",
                    name: "TEST 4",
                    symbol: "TEST 4",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955": {
                  balance: "23400",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    l2Address: "0x9488fc54fCcC6F319D4863dDC2c2899ED35D8955",
                    name: "TEST 5",
                    symbol: "TEST 5",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 103,
              sealedNonce: 0,
              type: "account",
              verifiedNonce: 0,
            })
          );
      });
    });

    describe("when existing contract address is requested", () => {
      it("returns HTTP 200 and the contract address record", () => {
        return request(app.getHttpServer())
          .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb68")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91d0A23f34E535E44Df8Ba84c53a0945Cf0eEb68",
              balances: {
                "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957": {
                  balance: "45600",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    l2Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    name: "TEST 7",
                    symbol: "TEST 7",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959": {
                  balance: "67800",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    l2Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    name: "TEST 9",
                    symbol: "TEST 9",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958": {
                  balance: "56700",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    l2Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    name: "TEST 8",
                    symbol: "TEST 8",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 106,
              bytecode: "0x000012",
              createdInBlockNumber: 10,
              creatorAddress: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
              isEvmLike: false,
              totalTransactions: 4,
              type: "contract",
            })
          );
      });

      it("returns HTTP 200 and the contract address record for an address specified with the upper case letters", () => {
        return request(app.getHttpServer())
          .get("/address/0x91D0A23F34E535E44DF8BA84C53A0945CF0EEB68")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91d0A23f34E535E44Df8Ba84c53a0945Cf0eEb68",
              balances: {
                "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957": {
                  balance: "45600",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    l2Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    name: "TEST 7",
                    symbol: "TEST 7",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959": {
                  balance: "67800",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    l2Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    name: "TEST 9",
                    symbol: "TEST 9",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958": {
                  balance: "56700",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    l2Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    name: "TEST 8",
                    symbol: "TEST 8",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 106,
              bytecode: "0x000012",
              createdInBlockNumber: 10,
              creatorAddress: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
              isEvmLike: false,
              totalTransactions: 4,
              type: "contract",
            })
          );
      });

      it("returns HTTP 200 and the contract address record for not properly normalized address", () => {
        return request(app.getHttpServer())
          .get("/address/0x91D0a23f34E535e44df8ba84c53a0945cf0eeb68")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91d0A23f34E535E44Df8Ba84c53a0945Cf0eEb68",
              balances: {
                "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957": {
                  balance: "45600",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    l2Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    name: "TEST 7",
                    symbol: "TEST 7",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959": {
                  balance: "67800",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    l2Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    name: "TEST 9",
                    symbol: "TEST 9",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958": {
                  balance: "56700",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    l2Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    name: "TEST 8",
                    symbol: "TEST 8",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 106,
              bytecode: "0x000012",
              createdInBlockNumber: 10,
              creatorAddress: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
              isEvmLike: false,
              totalTransactions: 4,
              type: "contract",
            })
          );
      });

      it("returns HTTP 200 and the contract address record for an address specified without 0x", () => {
        return request(app.getHttpServer())
          .get("/address/91d0a23f34e535e44df8ba84c53a0945cf0eeb68")
          .expect(200)
          .expect((res) =>
            expect(res.body).toStrictEqual({
              address: "0x91d0A23f34E535E44Df8Ba84c53a0945Cf0eEb68",
              balances: {
                "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957": {
                  balance: "45600",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    l2Address: "0x9488fC54fcCC6f319D4863Ddc2C2899ED35d8957",
                    name: "TEST 7",
                    symbol: "TEST 7",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959": {
                  balance: "67800",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    l2Address: "0x9488fC54fccC6F319d4863DDc2C2899ed35d8959",
                    name: "TEST 9",
                    symbol: "TEST 9",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
                "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958": {
                  balance: "56700",
                  token: {
                    decimals: 18,
                    l1Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    l2Address: "0x9488fc54FCCC6f319D4863dDc2c2899Ed35D8958",
                    name: "TEST 8",
                    symbol: "TEST 8",
                    iconURL: null,
                    liquidity: null,
                    usdPrice: null,
                  },
                },
              },
              blockNumber: 106,
              bytecode: "0x000012",
              createdInBlockNumber: 10,
              creatorAddress: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
              isEvmLike: false,
              totalTransactions: 4,
              type: "contract",
            })
          );
      });

      describe("and address does not have any balances", () => {
        it("returns HTTP 200 and the contract address record with empty balances and address block number", () => {
          return request(app.getHttpServer())
            .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb70")
            .expect(200)
            .expect((res) =>
              expect(res.body).toStrictEqual({
                address: "0x91D0A23f34e535E44dF8bA84C53a0945CF0Eeb70",
                balances: {},
                blockNumber: 10,
                bytecode: "0x000012",
                createdInBlockNumber: 10,
                creatorAddress: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
                creatorTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
                isEvmLike: false,
                totalTransactions: 0,
                type: "contract",
              })
            );
        });
      });
    });

    it("returns HTTP 400 for not valid address", () => {
      return request(app.getHttpServer()).get("/address/invalidAddressParam").expect(400);
    });

    it("returns HTTP 400 if an address starts with 0X (in upper case)", () => {
      return request(app.getHttpServer()).get("/address/0X91D0a23f34E535E44dF8ba84c53A0945CF0EEb67").expect(400);
    });
  });

  describe("/address/:address/logs GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and address logs for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=2&limit=3")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              blockNumber: 1,
              data: "0x",
              logIndex: 4,
              timestamp: "2022-11-21T18:16:51.000Z",
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
              ],
              transactionHash: null,
              transactionIndex: 1,
            },
            {
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              blockNumber: 1,
              data: "0x",
              logIndex: 5,
              timestamp: "2022-11-21T18:16:51.000Z",
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
              ],
              transactionHash: null,
              transactionIndex: 1,
            },
            {
              address: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              blockNumber: 1,
              data: "0x",
              logIndex: 6,
              timestamp: "2022-11-21T18:16:51.000Z",
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
              ],
              transactionHash: null,
              transactionIndex: 1,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=2&limit=3")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toStrictEqual({
            currentPage: 2,
            itemCount: 3,
            itemsPerPage: 3,
            totalItems: 15,
            totalPages: 5,
          })
        );
    });

    it("returns HTTP 200 and populated paging links considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=2&limit=3")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?limit=3",
            last: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=5&limit=3",
            next: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=3&limit=3",
            previous: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=1&limit=3",
          })
        );
    });

    it("returns HTTP 200 and the default address logs response if the address does not exist", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69/logs?page=1&limit=10")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [],
            links: {
              first: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69/logs?limit=10",
              last: "",
              next: "",
              previous: "",
            },
            meta: {
              currentPage: 1,
              itemCount: 0,
              itemsPerPage: 10,
              totalItems: 0,
              totalPages: 0,
            },
          })
        );
    });

    it("returns HTTP 400 for not valid address", () => {
      return request(app.getHttpServer()).get("/address/invalidAddressParam/logs").expect(400);
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?page=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?limit=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?limit=101")
        .expect(400);
    });

    it("returns HTTP 400 if older items than first 100_000 are requested", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/logs?limit=100&page=1001")
        .expect(400);
    });
  });

  describe("/address/:address/transfers GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemCount: 10,
            itemsPerPage: 10,
            totalItems: 15,
            totalPages: 2,
          })
        );
    });

    it("returns HTTP 200 and address transfers for the specified transfer type", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?type=withdrawal")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemCount: 5,
            itemsPerPage: 10,
            totalItems: 5,
            totalPages: 1,
          })
        )
        .expect((res) => expect(res.body.items[0].type).toBe(TransferType.Withdrawal));
    });

    it("returns HTTP 200 and address transfers for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get(
          "/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=2&limit=3&toDate=2025-11-10T14:44:38.000Z"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              amount: null,
              blockNumber: 1,
              fields: null,
              from: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              token: {
                decimals: 18,
                l1Address: null,
                l2Address: "0x97d0a23F34E535e44dF8ba84c53A0945cF0eEb67",
                name: "TEST",
                symbol: "TST",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0x97d0a23F34E535e44dF8ba84c53A0945cF0eEb67",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
              type: "mint",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: null,
              blockNumber: 1,
              fields: null,
              from: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              token: {
                l2Address: "0x000000000000000000000000000000000000800A",
                l1Address: "0x0000000000000000000000000000000000000000",
                symbol: "ETH",
                name: "Ether",
                decimals: 18,
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0x000000000000000000000000000000000000800A",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
              type: "transfer",
              tokenType: "BASETOKEN",
              isInternal: false,
            },
            {
              amount: null,
              blockNumber: 1,
              fields: null,
              from: "0x91D0a23f34E535E44dF8ba84c53A0945CF0EEb67",
              timestamp: "2022-11-21T18:16:51.000Z",
              to: "0x91d0a23f34e535e44Df8Ba84c53a0945cf0eEB60",
              token: {
                decimals: 18,
                l1Address: null,
                l2Address: "0x97d0a23F34E535e44dF8ba84c53A0945cF0eEb67",
                name: "TEST",
                symbol: "TST",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0x97d0a23F34E535e44dF8ba84c53A0945cF0eEb67",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
              type: "deposit",
              tokenType: "ERC20",
              isInternal: false,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get(
          "/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=2&limit=3&toDate=2025-11-10T14:44:38.000Z"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toStrictEqual({
            currentPage: 2,
            itemCount: 3,
            itemsPerPage: 3,
            totalItems: 15,
            totalPages: 5,
          })
        );
    });

    it("returns HTTP 200 and populated paging links considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get(
          "/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=2&limit=3&toDate=2025-11-10T14:44:38.000Z"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first:
              "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?limit=3&toDate=2025-11-10T14%3A44%3A38.000Z",
            last: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=5&limit=3&toDate=2025-11-10T14%3A44%3A38.000Z",
            next: "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=3&limit=3&toDate=2025-11-10T14%3A44%3A38.000Z",
            previous:
              "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=1&limit=3&toDate=2025-11-10T14%3A44%3A38.000Z",
          })
        );
    });

    it("returns HTTP 200 and the default address transfers response if the address does not exist", () => {
      return request(app.getHttpServer())
        .get(
          "/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69/transfers?page=1&limit=10&toDate=2025-11-10T14:44:38.000Z"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [],
            links: {
              first:
                "address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb69/transfers?limit=10&toDate=2025-11-10T14%3A44%3A38.000Z",
              last: "",
              next: "",
              previous: "",
            },
            meta: {
              currentPage: 1,
              itemCount: 0,
              itemsPerPage: 10,
              totalItems: 0,
              totalPages: 0,
            },
          })
        );
    });

    it("returns HTTP 400 for not valid address", () => {
      return request(app.getHttpServer()).get("/address/invalidAddressParam/transfers").expect(400);
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?page=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?limit=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?limit=101")
        .expect(400);
    });

    it("returns HTTP 400 if older items than first 100_000 are requested", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?limit=100&page=1001")
        .expect(400);
    });

    it("returns HTTP 400 if toDate is not a valid ISO date", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?toDate=20000107")
        .expect(400);
    });

    it("returns HTTP 400 if fromDate is not a valid ISO date", () => {
      return request(app.getHttpServer())
        .get("/address/0x91d0a23f34e535e44df8ba84c53a0945cf0eeb67/transfers?fromDate=20000107")
        .expect(400);
    });
  });
});
