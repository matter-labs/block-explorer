import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { Log } from "../src/log/log.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { PrividiumRulesService, EventPermissionRule } from "../src/prividium/prividium-rules.service";
import { LogService } from "../src/log/log.service";

const userAddr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const otherAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const contractAddr = "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC";
const topicUser = `0x${"0".repeat(24)}${userAddr.slice(2)}`;
const topicOther = `0x${"0".repeat(24)}${otherAddr.slice(2)}`;
const selectorFoo = "0xdeadbeef";
const selectorBar = "0xfeedface";
const topicExact = "0x" + "bb".repeat(32);

describe("Prividium Log Visibility (e2e)", () => {
  let app: INestApplication;
  let logRepo: Repository<Log>;
  let txRepo: Repository<Transaction>;
  let receiptRepo: Repository<TransactionReceipt>;
  let blockRepo: Repository<BlockDetails>;
  let logService: LogService;
  const fetchEventPermissionRules = jest.fn<Promise<EventPermissionRule[]>, [string]>();

  const seed = async () => {
    await blockRepo.insert({
      number: 1,
      hash: "0x" + "11".repeat(32),
      timestamp: new Date("2024-01-01T00:00:00Z"),
      gasLimit: "0",
      gasUsed: "0",
      baseFeePerGas: "1",
      extraData: "0x",
      l1TxCount: 1,
      l2TxCount: 1,
      miner: "0x0000000000000000000000000000000000000000",
    });

    await txRepo.insert({
      hash: "0x" + "aa".repeat(32),
      nonce: 0,
      blockNumber: 1,
      blockHash: "0x" + "11".repeat(32),
      transactionIndex: 0,
      from: userAddr,
      to: contractAddr,
      value: "0",
      gasPrice: "1",
      gasLimit: "21000",
      data: "0x",
      receiptStatus: 1,
      fee: "1",
      isL1Originated: false,
      type: 0,
      receivedAt: new Date("2024-01-01T00:00:00Z"),
    });

    await receiptRepo.insert({
      transactionHash: "0x" + "aa".repeat(32),
      from: userAddr,
      to: contractAddr,
      cumulativeGasUsed: "0",
      gasUsed: "0",
      contractAddress: null,
      status: 1,
    });

    // matching both visibleBy and permission rule
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorFoo, topicUser],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 0,
      timestamp: new Date("2024-01-01T00:00:00Z"),
    });

    // matches visibleBy only (topic has user), different selector
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorBar, topicUser],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 1,
      timestamp: new Date("2024-01-01T00:00:01Z"),
    });

    // matches permission rule only (topic1 equals other)
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorFoo, topicOther],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 2,
      timestamp: new Date("2024-01-01T00:00:02Z"),
    });

    // different contract, should be excluded
    await logRepo.insert({
      address: otherAddr,
      topics: [selectorFoo, topicUser],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 3,
      timestamp: new Date("2024-01-01T00:00:03Z"),
    });

    // topic2 equalTo match
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorFoo, topicUser, topicExact],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 4,
      timestamp: new Date("2024-01-01T00:00:04Z"),
    });

    // topic2 userAddress match
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorFoo, topicUser, topicUser],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 5,
      timestamp: new Date("2024-01-01T00:00:05Z"),
    });

    // topic3 userAddress match
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorFoo, topicUser, topicExact, topicUser],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 6,
      timestamp: new Date("2024-01-01T00:00:06Z"),
    });

    // topic3 equalTo match
    await logRepo.insert({
      address: contractAddr,
      topics: [selectorFoo, topicUser, topicExact, topicOther],
      data: "0x",
      blockNumber: 1,
      transactionHash: "0x" + "aa".repeat(32),
      transactionIndex: 0,
      logIndex: 7,
      timestamp: new Date("2024-01-01T00:00:07Z"),
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build()],
    })
      .overrideProvider(PrividiumRulesService)
      .useValue({
        fetchEventPermissionRules,
      })
      .compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();

    logRepo = app.get(getRepositoryToken(Log));
    txRepo = app.get(getRepositoryToken(Transaction));
    receiptRepo = app.get(getRepositoryToken(TransactionReceipt));
    blockRepo = app.get(getRepositoryToken(BlockDetails));
    logService = app.get(LogService);

    await seed();
  });

  afterAll(async () => {
    await logRepo.createQueryBuilder().delete().execute();
    await receiptRepo.createQueryBuilder().delete().execute();
    await txRepo.createQueryBuilder().delete().execute();
    await blockRepo.createQueryBuilder().delete().execute();
    await app.close();
  });

  const findIndexes = async (rules: EventPermissionRule[], limit = 20) => {
    fetchEventPermissionRules.mockResolvedValue(rules);
    const res = await logService.findAll(
      { transactionHash: "0x" + "aa".repeat(32) },
      { page: 1, limit, route: "transactions/tx/logs" },
      { isAdmin: false, token: "tok", userAddress: userAddr }
    );
    return res.items.map((l) => l.logIndex);
  };

  it("matches topic0 + topic1 equalTo", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: { type: "equalTo", value: topicOther },
        topic2: null,
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([2]);
  });

  it("allows any selector when topic0 is null", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: null,
        topic1: { type: "userAddress" },
        topic2: null,
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([7, 6, 5, 4, 1, 0]);
  });

  it("ignores topic1 when it is null", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: null,
        topic2: null,
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([7, 6, 5, 4, 2, 0]);
  });

  it("matches topic1 equalTo", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: { type: "equalTo", value: topicUser },
        topic2: null,
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([7, 6, 5, 4, 0]);
  });

  it("matches topic1 userAddress", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: { type: "userAddress" },
        topic2: null,
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([7, 6, 5, 4, 0]);
  });

  it("matches topic2 equalTo", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: null,
        topic2: { type: "equalTo", value: topicExact },
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([7, 6, 4]);
  });

  it("matches topic2 userAddress", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: null,
        topic2: { type: "userAddress" },
        topic3: null,
      },
    ]);
    expect(indexes).toEqual([5]);
  });

  it("matches topic3 equalTo", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: null,
        topic2: { type: "equalTo", value: topicExact },
        topic3: { type: "equalTo", value: topicOther },
      },
    ]);
    expect(indexes).toEqual([7]);
  });

  it("matches topic3 userAddress", async () => {
    const indexes = await findIndexes([
      {
        contractAddress: contractAddr,
        topic0: selectorFoo,
        topic1: null,
        topic2: { type: "equalTo", value: topicExact },
        topic3: { type: "userAddress" },
      },
    ]);
    expect(indexes).toEqual([6]);
  });

  it("returns no logs when permission rules empty", async () => {
    const indexes = await findIndexes([]);
    expect(indexes).toEqual([]);
  });

  it("returns all logs when admin", async () => {
    const res = await logService.findAll(
      { transactionHash: "0x" + "aa".repeat(32) },
      { page: 1, limit: 10, route: "transactions/tx/logs" },
      { isAdmin: true }
    );
    expect(res.items).toHaveLength(8);
  });
});
