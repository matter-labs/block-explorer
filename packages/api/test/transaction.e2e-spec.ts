import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { Token, TokenType } from "../src/token/token.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { AddressTransaction } from "../src/transaction/entities/addressTransaction.entity";
import { Transfer, TransferType } from "../src/transfer/transfer.entity";
import { Log } from "../src/log/log.entity";
import { BatchDetails } from "../src/batch/batchDetails.entity";
import { baseToken } from "../src/config";
import { numberToHex } from "../src/common/utils";

describe("TransactionController (e2e)", () => {
  let ETH_TOKEN;
  let app: INestApplication;
  let tokenRepository: Repository<Token>;
  let blockRepository: Repository<BlockDetails>;
  let transactionRepository: Repository<Transaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transferRepository: Repository<Transfer>;
  let logRepository: Repository<Log>;
  let batchRepository: Repository<BatchDetails>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    ETH_TOKEN = baseToken;
    app = moduleFixture.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    transactionReceiptRepository = app.get<Repository<TransactionReceipt>>(getRepositoryToken(TransactionReceipt));
    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transferRepository = app.get<Repository<Transfer>>(getRepositoryToken(Transfer));
    logRepository = app.get<Repository<Log>>(getRepositoryToken(Log));
    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));

    for (let i = 0; i < 10; i++) {
      const isCommitted = i > 2 && i < 9;
      const isProved = i > 4 && i < 9;
      const isExecuted = i > 6 && i < 9;
      await batchRepository.insert({
        number: i,
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        l1TxCount: i * 10,
        l2TxCount: i * 20,
        l1GasPrice: "10000000",
        l2FairGasPrice: "20000000",
        commitTxHash: isCommitted ? `0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa${i}` : null,
        committedAt: isCommitted ? new Date("2022-11-10T14:44:08.000Z") : null,
        proveTxHash: isProved ? `0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac${i}` : null,
        provenAt: isProved ? new Date("2022-11-10T14:44:08.000Z") : null,
        executeTxHash: isExecuted ? `0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab${i}` : null,
        executedAt: isExecuted ? new Date("2022-11-10T14:44:08.000Z") : null,
      });
    }

    for (let i = 0; i <= 9; i++) {
      await blockRepository.insert({
        number: i,
        hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        gasLimit: "0",
        gasUsed: "0",
        baseFeePerGas: "100000000",
        extraData: "0x",
        l1TxCount: 1,
        l2TxCount: 1,
        l1BatchNumber: i,
        miner: "0x0000000000000000000000000000000000000000",
      });
    }

    const baseTxPayload = {
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
      value: "0x2386f26fc10000",
      fee: "0x2386f26fc10000",
      nonce: 42,
      blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      isL1Originated: true,
      gasLimit: "1000000",
      gasPrice: "100",
      type: 255,
    };

    for (let i = 0; i < 10; i++) {
      const transactionSpec = {
        ...baseTxPayload,
        hash: `0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e2${i}`,
        transactionIndex: 3233070 + i,
        blockNumber: 0,
        receivedAt: `2010-11-21T18:16:0${i}.000Z`,
        l1BatchNumber: 0,
        receiptStatus: 0,
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

    for (let i = 0; i <= 9; i++) {
      const transactionSpec = {
        ...baseTxPayload,
        hash: `0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e1${i}`,
        transactionIndex: 3233097 + i,
        blockNumber: i < 3 ? 1 : i,
        receivedAt: `2022-11-21T18:16:0${i}.000Z`,
        l1BatchNumber: i < 3 ? 1 : i,
        receiptStatus: i < 9 ? 1 : 0,
        gasPrice: BigInt(1000 + i).toString(),
        gasLimit: BigInt(2000 + i).toString(),
        maxFeePerGas: BigInt(3000 + i).toString(),
        maxPriorityFeePerGas: BigInt(4000 + i).toString(),
        gasPerPubdata: numberToHex(BigInt(5000 + i)),
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

      await transactionReceiptRepository.insert({
        transactionHash: transactionSpec.hash,
        from: transactionSpec.from,
        status: 1,
        gasUsed: (7000 + i).toString(),
        cumulativeGasUsed: (10000 + i).toString(),
      });
    }

    for (let i = 0; i < 20; i++) {
      await logRepository.insert({
        address: `0x000000000000000000000000000000000000800${i}`,
        topics: [
          "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
          "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
          "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
          "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
        ],
        data: "0x",
        blockNumber: 1,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        transactionIndex: 1,
        logIndex: i + 1,
        timestamp: "2022-11-21T18:16:00.000Z",
      });
    }

    await tokenRepository.insert({
      l2Address: ETH_TOKEN.l2Address,
      l1Address: ETH_TOKEN.l1Address,
      symbol: ETH_TOKEN.symbol,
      name: ETH_TOKEN.name,
      decimals: ETH_TOKEN.decimals,
      blockNumber: 0,
      logIndex: 0,
    });

    await tokenRepository.insert({
      l2Address: "0xd754ff5e8a6f257e162f72578a4bb0493c068101",
      l1Address: "0xf754ff5e8a6f257e162f72578a4bb0493c068101",
      symbol: "TEST",
      name: "TEST token",
      decimals: 18,
      blockNumber: 1,
      logIndex: 0,
    });

    let enumIndex = 0;
    const transferTypeValues = Object.values(TransferType);
    for (let i = 0; i < 20; i++) {
      const type =
        enumIndex < transferTypeValues.length ? transferTypeValues[enumIndex++] : transferTypeValues[(enumIndex = 0)];

      await transferRepository.insert({
        from: "0x0000000000000000000000000000000000008007",
        to: "0x52312ad6f01657413b2eae9287f6b9adad93d5fd",
        blockNumber: 0,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
        tokenAddress:
          i % 2 ? "0xd754ff5e8a6f257e162f72578a4bb0493c068101" : "0x000000000000000000000000000000000000800a",
        tokenType: i % 2 ? TokenType.ERC20 : TokenType.BaseToken,
        amount: "2000",
        type,
        logIndex: i,
        transactionIndex: 0,
        timestamp: "2022-11-21T18:16:00.000Z",
        isFeeOrRefund: type === TransferType.Fee || type === TransferType.Refund,
        isInternal: false,
      });
    }
  });

  afterAll(async () => {
    await logRepository.delete({});
    await transferRepository.delete({});
    await tokenRepository.delete({});
    await addressTransactionRepository.delete({});
    await transactionRepository.delete({});
    await transactionReceiptRepository.delete({});
    await blockRepository.delete({});
    await batchRepository.delete({});

    await app.close();
  });

  describe("/transactions GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/transactions")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and transactions for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/transactions?page=1&limit=10")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 9,
              commitTxHash: null,
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2009",
              gasPrice: "1009",
              gasPerPubdata: "5009",
              maxFeePerGas: "3009",
              maxPriorityFeePerGas: "4009",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e19",
              isL1BatchSealed: false,
              isL1Originated: true,
              l1BatchNumber: 9,
              nonce: 42,
              proveTxHash: null,
              receivedAt: "2022-11-21T18:16:09.000Z",
              status: "failed",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233106,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 8,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa8",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab8",
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2008",
              gasPrice: "1008",
              gasPerPubdata: "5008",
              maxFeePerGas: "3008",
              maxPriorityFeePerGas: "4008",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e18",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 8,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac8",
              receivedAt: "2022-11-21T18:16:08.000Z",
              status: "verified",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233105,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 7,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa7",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab7",
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2007",
              gasPrice: "1007",
              gasPerPubdata: "5007",
              maxFeePerGas: "3007",
              maxPriorityFeePerGas: "4007",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e17",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 7,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac7",
              receivedAt: "2022-11-21T18:16:07.000Z",
              status: "verified",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233104,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 6,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa6",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2006",
              gasPrice: "1006",
              gasPerPubdata: "5006",
              maxFeePerGas: "3006",
              maxPriorityFeePerGas: "4006",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e16",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 6,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac6",
              receivedAt: "2022-11-21T18:16:06.000Z",
              status: "proved",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233103,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 5,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa5",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2005",
              gasPrice: "1005",
              gasPerPubdata: "5005",
              maxFeePerGas: "3005",
              maxPriorityFeePerGas: "4005",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 5,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac5",
              receivedAt: "2022-11-21T18:16:05.000Z",
              status: "proved",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233102,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 4,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa4",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasPrice: "1004",
              gasLimit: "2004",
              gasPerPubdata: "5004",
              maxFeePerGas: "3004",
              maxPriorityFeePerGas: "4004",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e14",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 4,
              nonce: 42,
              proveTxHash: null,
              receivedAt: "2022-11-21T18:16:04.000Z",
              status: "committed",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233101,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 3,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa3",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2003",
              gasPrice: "1003",
              gasPerPubdata: "5003",
              maxFeePerGas: "3003",
              maxPriorityFeePerGas: "4003",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e13",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 3,
              nonce: 42,
              proveTxHash: null,
              receivedAt: "2022-11-21T18:16:03.000Z",
              status: "committed",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233100,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 1,
              commitTxHash: null,
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasPrice: "1002",
              gasLimit: "2002",
              gasPerPubdata: "5002",
              maxFeePerGas: "3002",
              maxPriorityFeePerGas: "4002",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e12",
              isL1BatchSealed: false,
              isL1Originated: true,
              l1BatchNumber: 1,
              nonce: 42,
              proveTxHash: null,
              receivedAt: "2022-11-21T18:16:02.000Z",
              status: "included",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233099,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 1,
              commitTxHash: null,
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasPrice: "1001",
              gasLimit: "2001",
              gasPerPubdata: "5001",
              maxFeePerGas: "3001",
              maxPriorityFeePerGas: "4001",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
              isL1BatchSealed: false,
              isL1Originated: true,
              l1BatchNumber: 1,
              nonce: 42,
              proveTxHash: null,
              receivedAt: "2022-11-21T18:16:01.000Z",
              status: "included",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233098,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 1,
              commitTxHash: null,
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2000",
              gasPrice: "1000",
              gasPerPubdata: "5000",
              maxFeePerGas: "3000",
              maxPriorityFeePerGas: "4000",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              isL1BatchSealed: false,
              isL1Originated: true,
              l1BatchNumber: 1,
              nonce: 42,
              proveTxHash: null,
              receivedAt: "2022-11-21T18:16:00.000Z",
              status: "included",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233097,
              type: 255,
              value: "0x2386f26fc10000",
            },
          ])
        );
    });

    it("returns HTTP 200 and transactions for the specified paging configuration with date filters", () => {
      return request(app.getHttpServer())
        .get("/transactions?page=1&limit=3&fromDate=2022-11-21T18:16:01.000Z&toDate=2022-11-21T18:16:08.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 8,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa8",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab8",
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2008",
              gasPrice: "1008",
              gasPerPubdata: "5008",
              maxFeePerGas: "3008",
              maxPriorityFeePerGas: "4008",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e18",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 8,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac8",
              receivedAt: "2022-11-21T18:16:08.000Z",
              status: "verified",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233105,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 7,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa7",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab7",
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2007",
              gasPrice: "1007",
              gasPerPubdata: "5007",
              maxFeePerGas: "3007",
              maxPriorityFeePerGas: "4007",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e17",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 7,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac7",
              receivedAt: "2022-11-21T18:16:07.000Z",
              status: "verified",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233104,
              type: 255,
              value: "0x2386f26fc10000",
            },
            {
              blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
              blockNumber: 6,
              commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa6",
              data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              error: null,
              revertReason: null,
              executeTxHash: null,
              fee: "0x2386f26fc10000",
              from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              gasLimit: "2006",
              gasPrice: "1006",
              gasPerPubdata: "5006",
              maxFeePerGas: "3006",
              maxPriorityFeePerGas: "4006",
              hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e16",
              isL1BatchSealed: true,
              isL1Originated: true,
              l1BatchNumber: 6,
              nonce: 42,
              proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac6",
              receivedAt: "2022-11-21T18:16:06.000Z",
              status: "proved",
              to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              transactionIndex: 3233103,
              type: 255,
              value: "0x2386f26fc10000",
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get("/transactions?page=2&limit=3")
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

    it("returns HTTP 200 and populated paging metadata for request with date filters", () => {
      return request(app.getHttpServer())
        .get("/transactions?page=2&limit=3&fromDate=2022-11-21T18:16:01.000Z&toDate=2022-11-21T18:16:08.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toStrictEqual({
            currentPage: 2,
            itemCount: 3,
            itemsPerPage: 3,
            totalItems: 8,
            totalPages: 3,
          })
        );
    });

    it("returns HTTP 200 and populated paging links", () => {
      return request(app.getHttpServer())
        .get("/transactions?page=2&limit=3&fromDate=2022-11-21T18:16:01.000Z&toDate=2022-11-21T18:16:08.000Z")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first: "transactions?limit=3&fromDate=2022-11-21T18%3A16%3A01.000Z&toDate=2022-11-21T18%3A16%3A08.000Z",
            last: "transactions?page=3&limit=3&fromDate=2022-11-21T18%3A16%3A01.000Z&toDate=2022-11-21T18%3A16%3A08.000Z",
            next: "transactions?page=3&limit=3&fromDate=2022-11-21T18%3A16%3A01.000Z&toDate=2022-11-21T18%3A16%3A08.000Z",
            previous:
              "transactions?page=1&limit=3&fromDate=2022-11-21T18%3A16%3A01.000Z&toDate=2022-11-21T18%3A16%3A08.000Z",
          })
        );
    });

    it("returns HTTP 200 and transactions for the specified L1 batch number", () => {
      return request(app.getHttpServer())
        .get("/transactions?l1BatchNumber=1&page=2&limit=1")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: 1,
                commitTxHash: null,
                data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                error: null,
                revertReason: null,
                executeTxHash: null,
                fee: "0x2386f26fc10000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gasLimit: "2001",
                gasPrice: "1001",
                gasPerPubdata: "5001",
                maxFeePerGas: "3001",
                maxPriorityFeePerGas: "4001",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
                isL1BatchSealed: false,
                isL1Originated: true,
                l1BatchNumber: 1,
                nonce: 42,
                proveTxHash: null,
                receivedAt: "2022-11-21T18:16:01.000Z",
                status: "included",
                to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                transactionIndex: 3233098,
                type: 255,
                value: "0x2386f26fc10000",
              },
            ],
            links: {
              first: "transactions?limit=1&l1BatchNumber=1",
              last: "transactions?page=3&limit=1&l1BatchNumber=1",
              next: "transactions?page=3&limit=1&l1BatchNumber=1",
              previous: "transactions?page=1&limit=1&l1BatchNumber=1",
            },
            meta: {
              currentPage: 2,
              itemCount: 1,
              itemsPerPage: 1,
              totalItems: 3,
              totalPages: 3,
            },
          })
        );
    });

    it("returns HTTP 200 and transactions for the specified block number", () => {
      return request(app.getHttpServer())
        .get("/transactions?blockNumber=1&page=2&limit=1")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: 1,
                commitTxHash: null,
                data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                error: null,
                revertReason: null,
                executeTxHash: null,
                fee: "0x2386f26fc10000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gasLimit: "2001",
                gasPrice: "1001",
                gasPerPubdata: "5001",
                maxFeePerGas: "3001",
                maxPriorityFeePerGas: "4001",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e11",
                isL1BatchSealed: false,
                isL1Originated: true,
                l1BatchNumber: 1,
                nonce: 42,
                proveTxHash: null,
                receivedAt: "2022-11-21T18:16:01.000Z",
                status: "included",
                to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                transactionIndex: 3233098,
                type: 255,
                value: "0x2386f26fc10000",
              },
            ],
            links: {
              first: "transactions?limit=1&blockNumber=1",
              last: "transactions?page=3&limit=1&blockNumber=1",
              next: "transactions?page=3&limit=1&blockNumber=1",
              previous: "transactions?page=1&limit=1&blockNumber=1",
            },
            meta: {
              currentPage: 2,
              itemCount: 1,
              itemsPerPage: 1,
              totalItems: 3,
              totalPages: 3,
            },
          })
        );
    });

    it("returns HTTP 200 and transactions for the specified address", () => {
      return request(app.getHttpServer())
        .get("/transactions?address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C&page=2&limit=2")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: 7,
                commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa7",
                data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                error: null,
                revertReason: null,
                executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab7",
                fee: "0x2386f26fc10000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gasLimit: "2007",
                gasPrice: "1007",
                gasPerPubdata: "5007",
                maxFeePerGas: "3007",
                maxPriorityFeePerGas: "4007",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e17",
                isL1BatchSealed: true,
                isL1Originated: true,
                l1BatchNumber: 7,
                nonce: 42,
                proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac7",
                receivedAt: "2022-11-21T18:16:07.000Z",
                status: "verified",
                to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                transactionIndex: 3233104,
                type: 255,
                value: "0x2386f26fc10000",
              },
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: 6,
                commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa6",
                data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                error: null,
                revertReason: null,
                executeTxHash: null,
                fee: "0x2386f26fc10000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gasLimit: "2006",
                gasPrice: "1006",
                gasPerPubdata: "5006",
                maxFeePerGas: "3006",
                maxPriorityFeePerGas: "4006",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e16",
                isL1BatchSealed: true,
                isL1Originated: true,
                l1BatchNumber: 6,
                nonce: 42,
                proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac6",
                receivedAt: "2022-11-21T18:16:06.000Z",
                status: "proved",
                to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                transactionIndex: 3233103,
                type: 255,
                value: "0x2386f26fc10000",
              },
            ],
            links: {
              first: "transactions?limit=2&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              last: "transactions?page=8&limit=2&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              next: "transactions?page=3&limit=2&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
              previous: "transactions?page=1&limit=2&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            },
            meta: {
              currentPage: 2,
              itemCount: 2,
              itemsPerPage: 2,
              totalItems: 15,
              totalPages: 8,
            },
          })
        );
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer()).get("/transactions?page=0").expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer()).get("/transactions?limit=0").expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer()).get("/transactions?limit=101").expect(400);
    });

    it("returns HTTP 400 if older items than first 100_000 are requested", () => {
      return request(app.getHttpServer()).get("/transactions?limit=100&page=1001").expect(400);
    });

    it("returns HTTP 400 if specified block number is not valid", () => {
      return request(app.getHttpServer()).get("/transactions?blockNumber=abc").expect(400);
    });

    it("returns HTTP 400 if specified l1 batch number is not valid", () => {
      return request(app.getHttpServer()).get("/transactions?l1BatchNumber=abc").expect(400);
    });

    it("returns HTTP 400 if specified address is not valid", () => {
      return request(app.getHttpServer()).get("/transactions?address=abc").expect(400);
    });

    it("returns HTTP 400 if toDate is not a valid ISO date", () => {
      return request(app.getHttpServer()).get("/transactions?toDate=20000107").expect(400);
    });

    it("returns HTTP 400 if fromDate is not a valid ISO date", () => {
      return request(app.getHttpServer()).get("/transactions?fromDate=20000107").expect(400);
    });
  });

  describe("/transactions/:transactionHash GET", () => {
    it("returns HTTP 200 and the transaction for an existing verified transaction", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e18")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            blockNumber: 8,
            commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa8",
            data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
            error: null,
            revertReason: null,
            executeTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ab8",
            fee: "0x2386f26fc10000",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gasLimit: "2008",
            gasPrice: "1008",
            gasUsed: "7008",
            gasPerPubdata: "5008",
            maxFeePerGas: "3008",
            maxPriorityFeePerGas: "4008",
            hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e18",
            isL1BatchSealed: true,
            isL1Originated: true,
            l1BatchNumber: 8,
            nonce: 42,
            proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac8",
            receivedAt: "2022-11-21T18:16:08.000Z",
            status: "verified",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            transactionIndex: 3233105,
            type: 255,
            value: "0x2386f26fc10000",
          })
        );
    });

    it("returns HTTP 200 and the transaction for an existing proved transaction", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            blockNumber: 5,
            commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa5",
            data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
            error: null,
            revertReason: null,
            executeTxHash: null,
            fee: "0x2386f26fc10000",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gasLimit: "2005",
            gasPrice: "1005",
            gasUsed: "7005",
            gasPerPubdata: "5005",
            maxFeePerGas: "3005",
            maxPriorityFeePerGas: "4005",
            hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e15",
            isL1BatchSealed: true,
            isL1Originated: true,
            l1BatchNumber: 5,
            nonce: 42,
            proveTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5ac5",
            receivedAt: "2022-11-21T18:16:05.000Z",
            status: "proved",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            transactionIndex: 3233102,
            type: 255,
            value: "0x2386f26fc10000",
          })
        );
    });

    it("returns HTTP 200 and the transaction for an existing committed transaction", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e13")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            blockNumber: 3,
            commitTxHash: "0xeb5ead20476b91008c3b6e44005017e697de78e4fd868d99d2c58566655c5aa3",
            data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
            error: null,
            revertReason: null,
            executeTxHash: null,
            fee: "0x2386f26fc10000",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gasLimit: "2003",
            gasPrice: "1003",
            gasUsed: "7003",
            gasPerPubdata: "5003",
            maxFeePerGas: "3003",
            maxPriorityFeePerGas: "4003",
            hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e13",
            isL1BatchSealed: true,
            isL1Originated: true,
            l1BatchNumber: 3,
            nonce: 42,
            proveTxHash: null,
            receivedAt: "2022-11-21T18:16:03.000Z",
            status: "committed",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            transactionIndex: 3233100,
            type: 255,
            value: "0x2386f26fc10000",
          })
        );
    });

    it("returns HTTP 200 and the transaction for an existing included transaction", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            blockNumber: 1,
            commitTxHash: null,
            data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
            error: null,
            revertReason: null,
            executeTxHash: null,
            fee: "0x2386f26fc10000",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gasLimit: "2000",
            gasPrice: "1000",
            gasUsed: "7000",
            gasPerPubdata: "5000",
            maxFeePerGas: "3000",
            maxPriorityFeePerGas: "4000",
            hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
            isL1BatchSealed: true,
            isL1Originated: true,
            l1BatchNumber: 1,
            nonce: 42,
            proveTxHash: null,
            receivedAt: "2022-11-21T18:16:00.000Z",
            status: "included",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            transactionIndex: 3233097,
            type: 255,
            value: "0x2386f26fc10000",
          })
        );
    });

    it("returns HTTP 200 and the transaction for an existing failed transaction", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e19")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            blockNumber: 9,
            commitTxHash: null,
            data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
            error: null,
            revertReason: null,
            executeTxHash: null,
            fee: "0x2386f26fc10000",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gasLimit: "2009",
            gasPrice: "1009",
            gasUsed: "7009",
            gasPerPubdata: "5009",
            maxFeePerGas: "3009",
            maxPriorityFeePerGas: "4009",
            hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e19",
            isL1BatchSealed: true,
            isL1Originated: true,
            l1BatchNumber: 9,
            nonce: 42,
            proveTxHash: null,
            receivedAt: "2022-11-21T18:16:09.000Z",
            status: "failed",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            transactionIndex: 3233106,
            type: 255,
            value: "0x2386f26fc10000",
          })
        );
    });

    it("returns HTTP 200 and the transaction if transaction hash is specified in the upper case", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
            blockNumber: 1,
            commitTxHash: null,
            data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
            error: null,
            revertReason: null,
            executeTxHash: null,
            fee: "0x2386f26fc10000",
            from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            gasLimit: "2000",
            gasPrice: "1000",
            gasUsed: "7000",
            gasPerPubdata: "5000",
            maxFeePerGas: "3000",
            maxPriorityFeePerGas: "4000",
            hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
            isL1BatchSealed: true,
            isL1Originated: true,
            l1BatchNumber: 1,
            nonce: 42,
            proveTxHash: null,
            receivedAt: "2022-11-21T18:16:00.000Z",
            status: "included",
            to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            transactionIndex: 3233097,
            type: 255,
            value: "0x2386f26fc10000",
          })
        );
    });

    it("returns HTTP 400 for not valid transaction hash", () => {
      return request(app.getHttpServer()).get("/transactions/invalidHashParam").expect(400);
    });

    it("returns HTTP 404 if the transaction with the specified transaction hash does not exist", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e1c")
        .expect(404);
    });
  });

  describe("/transactions/:transactionHash/transfers GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and transaction transfers for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get(
          "/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=1&limit=9"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
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
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "deposit",
              tokenType: "BASETOKEN",
              isInternal: false,
            },
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token",
                symbol: "TEST",
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
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
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
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "withdrawal",
              tokenType: "BASETOKEN",
              isInternal: false,
            },
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token",
                symbol: "TEST",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "fee",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
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
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "mint",
              tokenType: "BASETOKEN",
              isInternal: false,
            },
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token",
                symbol: "TEST",
                iconURL: null,
                liquidity: null,
                usdPrice: null,
              },
              tokenAddress: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "refund",
              tokenType: "ERC20",
              isInternal: false,
            },
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
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
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "deposit",
              tokenType: "BASETOKEN",
              isInternal: false,
            },
            {
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
              token: {
                decimals: 18,
                l1Address: "0xf754ff5E8a6F257e162F72578a4Bb0493c068101",
                l2Address: "0xD754FF5E8a6F257E162f72578a4bB0493c068101",
                name: "TEST token",
                symbol: "TEST",
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
              amount: "2000",
              blockNumber: 0,
              fields: null,
              from: "0x0000000000000000000000000000000000008007",
              timestamp: "2022-11-21T18:16:00.000Z",
              to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
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
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              type: "transfer",
              tokenType: "BASETOKEN",
              isInternal: false,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get(
          "/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=2&limit=3"
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
          "/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=2&limit=3"
        )
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first: "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?limit=3",
            last: "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=5&limit=3",
            next: "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=3&limit=3",
            previous:
              "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=1&limit=3",
          })
        );
    });

    it("returns HTTP 200 and transaction transfers if transaction hash is specified in the upper case", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/transfers?limit=1")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                amount: "2000",
                blockNumber: 0,
                fields: null,
                from: "0x0000000000000000000000000000000000008007",
                timestamp: "2022-11-21T18:16:00.000Z",
                to: "0x52312Ad6f01657413b2eae9287F6b9Adad93d5fd",
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
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
                type: "deposit",
                tokenType: "BASETOKEN",
                isInternal: false,
              },
            ],
            links: {
              first:
                "transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/transfers?limit=1",
              last: "transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/transfers?page=15&limit=1",
              next: "transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/transfers?page=2&limit=1",
              previous: "",
            },
            meta: {
              currentPage: 1,
              itemCount: 1,
              itemsPerPage: 1,
              totalItems: 15,
              totalPages: 15,
            },
          })
        );
    });

    it("returns HTTP 400 for not valid transaction hash", () => {
      return request(app.getHttpServer()).get("/transactions/invalidHashParam/transfers").expect(400);
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?page=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?limit=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?limit=101")
        .expect(400);
    });

    it("returns HTTP 400 if older items than first 100_000 are requested", () => {
      return request(app.getHttpServer())
        .get(
          "/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/transfers?limit=100&page=1001"
        )
        .expect(400);
    });

    it("returns HTTP 404 if the transaction with the specified hash does not exist", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e1c/transfers")
        .expect(404);
    });
  });

  describe("/transactions/:transactionHash/logs GET", () => {
    it("returns HTTP 200 and uses default paging configuration if no paging params specified", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs")
        .expect(200)
        .expect((res) =>
          expect(res.body.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 10,
          })
        );
    });

    it("returns HTTP 200 and transaction logs for the specified paging configuration", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=2&limit=3")
        .expect(200)
        .expect((res) =>
          expect(res.body.items).toStrictEqual([
            {
              address: "0x0000000000000000000000000000000000008003",
              blockNumber: 1,
              data: "0x",
              logIndex: 4,
              timestamp: "2022-11-21T18:16:00.000Z",
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
              ],
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              transactionIndex: 1,
            },
            {
              address: "0x0000000000000000000000000000000000008004",
              blockNumber: 1,
              data: "0x",
              logIndex: 5,
              timestamp: "2022-11-21T18:16:00.000Z",
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
              ],
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              transactionIndex: 1,
            },
            {
              address: "0x0000000000000000000000000000000000008005",
              blockNumber: 1,
              data: "0x",
              logIndex: 6,
              timestamp: "2022-11-21T18:16:00.000Z",
              topics: [
                "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
              ],
              transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
              transactionIndex: 1,
            },
          ])
        );
    });

    it("returns HTTP 200 and populated paging metadata considering limited pagination settings", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=2&limit=3")
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
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=2&limit=3")
        .expect(200)
        .expect((res) =>
          expect(res.body.links).toStrictEqual({
            first: "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?limit=3",
            last: "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=5&limit=3",
            next: "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=3&limit=3",
            previous:
              "transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=1&limit=3",
          })
        );
    });

    it("returns HTTP 200 and transaction logs if transaction hash is specified in the upper case", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/logs?limit=1")
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            items: [
              {
                address: "0x0000000000000000000000000000000000008000",
                blockNumber: 1,
                data: "0x",
                logIndex: 1,
                timestamp: "2022-11-21T18:16:00.000Z",
                topics: [
                  "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
                  "0x00000000000000000000000052312ad6f01657413b2eae9287f6b9adad93d5fe",
                  "0x01000121454160924d2d2547cb1eb843bf7a6dc8a406b2a5dd1b183d5221865c",
                  "0x0000000000000000000000000265d9a5af8af5fe070933e5e549d8fef08e09f4",
                ],
                transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10",
                transactionIndex: 1,
              },
            ],
            links: {
              first: "transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/logs?limit=1",
              last: "transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/logs?page=15&limit=1",
              next: "transactions/0x8A008B8DBBC18035E56370ABB820E736B705D68D6AC12B203603DB8D9EA87E10/logs?page=2&limit=1",
              previous: "",
            },
            meta: {
              currentPage: 1,
              itemCount: 1,
              itemsPerPage: 1,
              totalItems: 15,
              totalPages: 15,
            },
          })
        );
    });

    it("returns HTTP 400 for not valid transaction hash", () => {
      return request(app.getHttpServer()).get("/transactions/invalidHashParam/logs").expect(400);
    });

    it("returns HTTP 400 if specified page is out of range", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?page=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit is out of range", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?limit=0")
        .expect(400);
    });

    it("returns HTTP 400 if specified limit exceeds 100", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?limit=101")
        .expect(400);
    });

    it("returns HTTP 400 if older items than first 100_000 are requested", () => {
      return request(app.getHttpServer())
        .get(
          "/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e10/logs?limit=100&page=1001"
        )
        .expect(400);
    });

    it("returns HTTP 404 if the transaction with the specified hash does not exist", () => {
      return request(app.getHttpServer())
        .get("/transactions/0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e1c/logs")
        .expect(404);
    });
  });
});
