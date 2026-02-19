import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AppModule } from "../../app.module";
import { Log } from "../../log/log.entity";
import { Transaction } from "../../transaction/entities/transaction.entity";
import { TransactionReceipt } from "../../transaction/entities/transactionReceipt.entity";
import { BlockDetails } from "../../block/blockDetails.entity";
import { PrividiumRulesService, EventPermissionRule } from "../prividium-rules.service";
import { LogService } from "../../log/log.service";
import { UserWithRoles } from "../../api/pipes/addUserRoles.pipe";

const userAddr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const otherAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const contractAddr = "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC";
const topicUser = `0x${"0".repeat(24)}${userAddr.slice(2)}`;
const topicOther = `0x${"0".repeat(24)}${otherAddr.slice(2)}`;
const selectorFoo = "0xdeadbeef";
const selectorBar = "0xfeedface";
const topicExact = "0x" + "bb".repeat(32);
const makeUser = (overrides: Partial<UserWithRoles> = {}): UserWithRoles => ({
  address: userAddr,
  token: "tok",
  roles: [],
  isAdmin: false,
  ...overrides,
});

describe("Prividium Log Visibility (e2e)", () => {
  let moduleRef: TestingModule;
  let logRepo: Repository<Log>;
  let txRepo: Repository<Transaction>;
  let receiptRepo: Repository<TransactionReceipt>;
  let blockRepo: Repository<BlockDetails>;
  let logService: LogService;
  const fetchEventPermissionRules = jest.fn<Promise<EventPermissionRule[]>, [string]>();

  // TODO: Refactor for clarity
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
    moduleRef = await Test.createTestingModule({
      imports: [AppModule.build()],
    })
      .overrideProvider(PrividiumRulesService)
      .useValue({
        fetchEventPermissionRules,
      })
      .compile();

    await moduleRef.init();

    logRepo = moduleRef.get(getRepositoryToken(Log));
    txRepo = moduleRef.get(getRepositoryToken(Transaction));
    receiptRepo = moduleRef.get(getRepositoryToken(TransactionReceipt));
    blockRepo = moduleRef.get(getRepositoryToken(BlockDetails));
    logService = moduleRef.get(LogService);

    await seed();
  });

  afterAll(async () => {
    if (logRepo && receiptRepo && txRepo && blockRepo) {
      await logRepo.createQueryBuilder().delete().execute();
      await receiptRepo.createQueryBuilder().delete().execute();
      await txRepo.createQueryBuilder().delete().execute();
      await blockRepo.createQueryBuilder().delete().execute();
    }

    if (moduleRef) {
      await moduleRef.close();
    }
  });

  beforeEach(() => {
    fetchEventPermissionRules.mockReset();
  });

  const findIndexes = async (rules: EventPermissionRule[], limit = 20) => {
    fetchEventPermissionRules.mockResolvedValue(rules);
    const res = await logService.findAll(
      { transactionHash: "0x" + "aa".repeat(32) },
      { page: 1, limit, route: "transactions/tx/logs" },
      { user: makeUser() }
    );
    return res.items.map((l) => l.logIndex);
  };

  const assertRuleCase = async (rules: EventPermissionRule[], expectedIndexes: number[]) => {
    const indexes = await findIndexes(rules);
    expect(indexes).toEqual(expectedIndexes);
    expect(fetchEventPermissionRules).toHaveBeenCalledWith("tok");
  };

  it("matches topic0 + topic1 equalTo", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: { type: "equalTo", value: topicOther },
          topic2: null,
          topic3: null,
        },
      ],
      [2]
    );
  });

  it("allows any selector when topic0 is null", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: null,
          topic1: { type: "userAddress" },
          topic2: null,
          topic3: null,
        },
      ],
      [7, 6, 5, 4, 1, 0]
    );
  });

  it("ignores topic1 when it is null", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: null,
          topic2: null,
          topic3: null,
        },
      ],
      [7, 6, 5, 4, 2, 0]
    );
  });

  it("matches topic1 equalTo", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: { type: "equalTo", value: topicUser },
          topic2: null,
          topic3: null,
        },
      ],
      [7, 6, 5, 4, 0]
    );
  });

  it("matches topic1 userAddress", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: { type: "userAddress" },
          topic2: null,
          topic3: null,
        },
      ],
      [7, 6, 5, 4, 0]
    );
  });

  it("matches topic2 equalTo", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: null,
          topic2: { type: "equalTo", value: topicExact },
          topic3: null,
        },
      ],
      [7, 6, 4]
    );
  });

  it("matches topic2 userAddress", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: null,
          topic2: { type: "userAddress" },
          topic3: null,
        },
      ],
      [5]
    );
  });

  it("matches topic3 equalTo", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: null,
          topic2: { type: "equalTo", value: topicExact },
          topic3: { type: "equalTo", value: topicOther },
        },
      ],
      [7]
    );
  });

  it("matches topic3 userAddress", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: null,
          topic2: { type: "equalTo", value: topicExact },
          topic3: { type: "userAddress" },
        },
      ],
      [6]
    );
  });

  it("matches by contractAddress only when all topics are null", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: null,
          topic1: null,
          topic2: null,
          topic3: null,
        },
      ],
      [7, 6, 5, 4, 2, 1, 0]
    );
  });

  it("matches different contract when rule points to that contract", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: otherAddr,
          topic0: selectorFoo,
          topic1: { type: "userAddress" },
          topic2: null,
          topic3: null,
        },
      ],
      [3]
    );
  });

  it("matches union of multiple rules", async () => {
    await assertRuleCase(
      [
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: { type: "equalTo", value: topicOther },
          topic2: null,
          topic3: null,
        },
        {
          contractAddress: contractAddr,
          topic0: selectorFoo,
          topic1: null,
          topic2: { type: "userAddress" },
          topic3: null,
        },
      ],
      [5, 2]
    );
  });

  it("returns no logs when permission rules empty", async () => {
    const indexes = await findIndexes([]);
    expect(indexes).toEqual([]);
  });

  it("returns all logs when admin", async () => {
    fetchEventPermissionRules.mockReset();
    const res = await logService.findAll(
      { transactionHash: "0x" + "aa".repeat(32) },
      { page: 1, limit: 10, route: "transactions/tx/logs" },
      { user: makeUser({ isAdmin: true }) }
    );
    expect(res.items).toHaveLength(8);
    expect(fetchEventPermissionRules).not.toHaveBeenCalled();
  });
});
