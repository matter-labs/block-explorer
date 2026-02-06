import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { Repository } from "typeorm";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { AddressTransaction } from "../src/transaction/entities/addressTransaction.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { Token, TokenType } from "../src/token/token.entity";
import { Balance } from "../src/balance/balance.entity";
import { AddressTransfer } from "../src/transfer/addressTransfer.entity";
import { Transfer, TransferType } from "../src/transfer/transfer.entity";
import { BASE_TOKEN_L2_ADDRESS } from "../src/common/constants";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

describe("Account API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let addressTransferRepository: Repository<AddressTransfer>;
  let transferRepository: Repository<Transfer>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let blockRepository: Repository<BlockDetails>;
  let tokenRepository: Repository<Token>;
  let balanceRepository: Repository<Balance>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    addressTransferRepository = app.get<Repository<AddressTransfer>>(getRepositoryToken(AddressTransfer));
    transferRepository = app.get<Repository<Transfer>>(getRepositoryToken(Transfer));
    transactionReceiptRepository = app.get<Repository<TransactionReceipt>>(getRepositoryToken(TransactionReceipt));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    tokenRepository = app.get<Repository<Token>>(getRepositoryToken(Token));
    balanceRepository = app.get<Repository<Balance>>(getRepositoryToken(Balance));

    for (let i = 1; i <= 2; i++) {
      await blockRepository.insert({
        number: i,
        hash: `0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb${i}`,
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        gasLimit: "0",
        gasUsed: "0",
        baseFeePerGas: "100000000",
        extraData: "0x",
        l1TxCount: 1,
        l2TxCount: 1,
        miner: "0x0000000000000000000000000000000000000000",
      });
    }

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

    await addressTransactionRepository.insert({
      number: 1,
      transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      blockNumber: 1,
      receivedAt: new Date("2023-01-01"),
      transactionIndex: 1,
    });

    await tokenRepository.insert({
      l1Address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe111",
      l2Address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe112",
      symbol: "TKN",
      name: "TKN",
      decimals: 18,
      blockNumber: 1,
      logIndex: 1,
    });

    const tokens = [
      {
        tokenType: TokenType.BaseToken,
        tokenAddress: "0x000000000000000000000000000000000000800a",
      },
      {
        tokenType: TokenType.ERC20,
        tokenAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe112",
      },
    ];

    for (let i = 0; i < 6; i++) {
      const transferSpec = {
        from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        blockNumber: i < 3 ? 1 : 2,
        transactionHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
        transactionIndex: i,
        timestamp: new Date("2022-11-21T18:16:51.000Z"),
        type: TransferType.Deposit,
        tokenType: tokens[i % 2].tokenType,
        tokenAddress: tokens[i % 2].tokenAddress,
        logIndex: i,
        isFeeOrRefund: false,
        isInternal: false,
        amount: (100 + i).toString(),
      };

      const insertResult = await transferRepository.insert(transferSpec);

      for (const address of new Set([transferSpec.from, transferSpec.to])) {
        await addressTransferRepository.insert({
          transferNumber: Number(insertResult.identifiers[0].number),
          address,
          tokenAddress: transferSpec.tokenAddress,
          blockNumber: transferSpec.blockNumber,
          timestamp: transferSpec.timestamp,
          tokenType: transferSpec.tokenType,
          isFeeOrRefund: transferSpec.isFeeOrRefund,
          logIndex: transferSpec.logIndex,
          isInternal: transferSpec.isInternal,
        });
      }
    }

    await balanceRepository.insert({
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      tokenAddress: BASE_TOKEN_L2_ADDRESS,
      blockNumber: 1,
      balance: "1000",
    });

    await balanceRepository.insert({
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
      tokenAddress: BASE_TOKEN_L2_ADDRESS,
      blockNumber: 1,
      balance: "100",
    });

    await balanceRepository.insert({
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      tokenAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe112",
      blockNumber: 1,
      balance: "10000",
    });
  });

  afterAll(async () => {
    await addressTransferRepository.createQueryBuilder().delete().execute();
    await transferRepository.createQueryBuilder().delete().execute();
    await addressTransactionRepository.createQueryBuilder().delete().execute();
    await transactionReceiptRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await balanceRepository.createQueryBuilder().delete().execute();
    await tokenRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe("/api?module=account&action=txlist GET", () => {
    it("returns HTTP 200 and no data found response when no account transactions found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=txlist&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "No transactions found",
            result: [],
          })
        );
    });

    it("returns HTTP 200 and transactions list when account transactions found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=txlist&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "1",
                confirmations: "1",
                contractAddress: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                functionName: "",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                isError: "1",
                isL1Originated: "1",
                methodId: "0x00000000",
                nonce: "42",
                timeStamp: "1290363360",
                to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                transactionIndex: "1",
                txreceipt_status: "0",
                value: "0x2386f26fc10000",
                type: "255",
              },
            ],
          })
        );
    });
  });

  describe("/api?module=account&action=tokentx GET", () => {
    it("returns HTTP 200 and no transactions found response when no account transfers found", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=tokentx&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35b`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "0",
            message: "No transactions found",
            result: [],
          })
        );
    });

    it("returns HTTP 200 and token transfers for the specified address", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=tokentx&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "2",
                confirmations: "0",
                contractAddress: "0xC7e0220D02d549c4846A6ec31d89c3B670ebe112",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "TKN",
                tokenSymbol: "TKN",
                transactionIndex: "1",
                value: "105",
                transactionType: "255",
              },
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "2",
                confirmations: "0",
                contractAddress: "0xC7e0220D02d549c4846A6ec31d89c3B670ebe112",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "TKN",
                tokenSymbol: "TKN",
                transactionIndex: "1",
                value: "103",
                transactionType: "255",
              },
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "1",
                confirmations: "1",
                contractAddress: "0xC7e0220D02d549c4846A6ec31d89c3B670ebe112",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "TKN",
                tokenSymbol: "TKN",
                transactionIndex: "1",
                value: "101",
                transactionType: "255",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and ETH transfers for the specified address and contract address", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=account&action=tokentx&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C&contractaddress=0x000000000000000000000000000000000000800a`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "2",
                confirmations: "0",
                contractAddress: "0x000000000000000000000000000000000000800A",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "Ether",
                tokenSymbol: "ETH",
                transactionIndex: "1",
                value: "104",
                transactionType: "255",
              },
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "1",
                confirmations: "1",
                contractAddress: "0x000000000000000000000000000000000000800A",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "Ether",
                tokenSymbol: "ETH",
                transactionIndex: "1",
                value: "102",
                transactionType: "255",
              },
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "1",
                confirmations: "1",
                contractAddress: "0x000000000000000000000000000000000000800A",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "Ether",
                tokenSymbol: "ETH",
                transactionIndex: "1",
                value: "100",
                transactionType: "255",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and token transfers for the specified address and startblock param", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=tokentx&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C&startblock=2`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "2",
                confirmations: "0",
                contractAddress: "0xC7e0220D02d549c4846A6ec31d89c3B670ebe112",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "TKN",
                tokenSymbol: "TKN",
                transactionIndex: "1",
                value: "105",
                transactionType: "255",
              },
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "2",
                confirmations: "0",
                contractAddress: "0xC7e0220D02d549c4846A6ec31d89c3B670ebe112",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "TKN",
                tokenSymbol: "TKN",
                transactionIndex: "1",
                value: "103",
                transactionType: "255",
              },
            ],
            status: "1",
          })
        );
    });

    it("returns HTTP 200 and token transfers for the specified address and endblock param", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=tokentx&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C&endblock=1`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            message: "OK",
            result: [
              {
                blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
                blockNumber: "1",
                confirmations: "1",
                contractAddress: "0xC7e0220D02d549c4846A6ec31d89c3B670ebe112",
                cumulativeGasUsed: "1100000",
                fee: "10000000000000000",
                from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
                gas: "1000000",
                gasPrice: "100",
                gasUsed: "900000",
                hash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20",
                input: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                nonce: "42",
                timeStamp: "1669054611",
                to: "0xc7E0220D02D549C4846a6eC31d89c3b670ebE35e",
                tokenDecimal: "18",
                tokenName: "TKN",
                tokenSymbol: "TKN",
                transactionIndex: "1",
                value: "101",
                transactionType: "255",
              },
            ],
            status: "1",
          })
        );
    });
  });

  describe("/api?module=account&action=balance GET", () => {
    it("returns HTTP 200 and 0 balance when account has no Ether balance", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=balance&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: "0",
          })
        );
    });

    it("returns HTTP 200 and account Ether balance when account has Ether balance", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=balance&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: "1000",
          })
        );
    });
  });

  describe("/api?module=account&action=tokenbalance GET", () => {
    it("returns HTTP 200 and 0 balance when account has no Token balance", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=account&action=balance&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D&contractaddress=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe113`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: "0",
          })
        );
    });

    it("returns HTTP 200 and account Token balance when account has Token balance", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=account&action=tokenbalance&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C&contractaddress=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe112`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: "10000",
          })
        );
    });
  });

  describe("/api?module=account&action=balancemulti GET", () => {
    it("returns HTTP 200 and accounts Ether balances", () => {
      return request(app.getHttpServer())
        .get(
          `/api?module=account&action=balancemulti&address=0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C,0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D,0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E`
        )
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: [
              {
                account: "0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c",
                balance: "1000",
              },
              {
                account: "0xc7e0220d02d549c4846a6ec31d89c3b670ebe35d",
                balance: "0",
              },
              {
                account: "0xc7e0220d02d549c4846a6ec31d89c3b670ebe35e",
                balance: "100",
              },
            ],
          })
        );
    });
  });

  describe("/api?module=account&action=getminedblocks GET", () => {
    it("returns HTTP 200 and list of mined blocks by address", () => {
      return request(app.getHttpServer())
        .get(`/api?module=account&action=getminedblocks&address=0x0000000000000000000000000000000000000000`)
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            status: "1",
            message: "OK",
            result: [
              {
                blockNumber: "2",
                blockReward: "0",
                timeStamp: "1668091448",
              },
              {
                blockNumber: "1",
                blockReward: "0",
                timeStamp: "1668091448",
              },
            ],
          })
        );
    });
  });
});
