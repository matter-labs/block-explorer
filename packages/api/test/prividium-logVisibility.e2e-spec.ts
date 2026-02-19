import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AppModule } from "../src/app.module";
import { Log } from "../src/log/log.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { EventPermissionRule, PrividiumRulesService } from "../src/prividium/prividium-rules.service";
import { LogService } from "../src/log/log.service";
import { UserWithRoles } from "../src/api/pipes/addUserRoles.pipe";

const userAddr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const topicUser = "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const topicOtherUser = "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8";

const contractMatching = "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC";
const selectorMatchingA = "0xaaaaaaaa";
const selectorMatchingB = "0xbbbbbbbb";

const contractOther = "0x000000000000000000000000000000000000000C";
const selectorOtherA = "0x0000000a";
const selectorOtherB = "0x0000000b";

const topicExactA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const topicExactB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const topicOtherA = "0x000000000000000000000000000000000000000000000000000000000000000a";
const topicOtherB = "0x000000000000000000000000000000000000000000000000000000000000000b";

const makeUser = (overrides: Partial<UserWithRoles> = {}): UserWithRoles => ({
  address: userAddr,
  token: "tok",
  roles: [],
  isAdmin: false,
  ...overrides,
});

const BLOCK_HASH = "0x" + "11".repeat(32);
const TX_HASH = "0x" + "aa".repeat(32);

type TestLog = Pick<Log, "address" | "topics">;

describe("Prividium Log Visibility (e2e)", () => {
  let moduleRef: TestingModule;
  let logRepo: Repository<Log>;
  let txRepo: Repository<Transaction>;
  let receiptRepo: Repository<TransactionReceipt>;
  let blockRepo: Repository<BlockDetails>;
  let logService: LogService;
  const fetchEventPermissionRules = jest.fn<Promise<EventPermissionRule[]>, [string]>();

  const seed = async () => {
    await blockRepo.insert({
      number: 1,
      hash: BLOCK_HASH,
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
      hash: TX_HASH,
      nonce: 0,
      blockNumber: 1,
      blockHash: BLOCK_HASH,
      transactionIndex: 0,
      from: userAddr,
      to: contractMatching,
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
      transactionHash: TX_HASH,
      from: userAddr,
      to: contractMatching,
      cumulativeGasUsed: "0",
      gasUsed: "0",
      contractAddress: null,
      status: 1,
    });
  };

  async function seedLogs(logs: TestLog[]) {
    let i = 0;

    await logRepo.insert(
      logs.map((log) => ({
        ...log,
        logIndex: i++,
        data: "0x",
        blockNumber: 1,
        transactionHash: TX_HASH,
        transactionIndex: 0,
        timestamp: new Date("2024-01-01T00:00:06Z"),
      }))
    );
  }

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

  beforeEach(async () => {
    fetchEventPermissionRules.mockReset();
    await logRepo.createQueryBuilder().delete().execute();
  });

  const assertRules = async (rules: EventPermissionRule[], expectedLogs: TestLog[]) => {
    fetchEventPermissionRules.mockResolvedValue(rules);

    const res = await logService.findAll(
      { transactionHash: TX_HASH },
      { page: 1, limit: 1000, route: "transactions/tx/logs" },
      { user: makeUser() }
    );

    expect(res.items).toHaveLength(expectedLogs.length);
    expect(res.items).toMatchObject(expectedLogs);
    expect(fetchEventPermissionRules).toHaveBeenCalledWith("tok");
    expect(fetchEventPermissionRules).toHaveBeenCalledTimes(1);
  };

  it("matches topic0 + topic1 equalTo", async () => {
    const matchingSelectorTopic1 = {
      address: contractMatching,
      topics: [selectorMatchingB, topicExactA],
    };
    const notMatchingTopic = {
      address: contractMatching,
      topics: [selectorMatchingB, topicOtherB],
    };
    const notMatchingSelector = {
      address: contractMatching,
      topics: [selectorOtherA, topicExactA],
    };
    const notMatchingMoreTopics = {
      address: contractMatching,
      topics: [selectorOtherA, topicExactA, topicExactA],
    };
    const notMatchingTopic2 = {
      address: contractMatching,
      topics: [selectorOtherA, topicExactA, topicExactA],
    };

    await seedLogs([
      matchingSelectorTopic1,
      notMatchingSelector,
      notMatchingTopic2,
      notMatchingTopic,
      notMatchingMoreTopics,
    ]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingB,
          topic1: { type: "equalTo", value: topicExactA },
          topic2: null,
          topic3: null,
        },
      ],
      [matchingSelectorTopic1]
    );
  });

  it("allows any selector when topic0 is null", async () => {
    const matchingSelectorA = {
      address: contractMatching,
      topics: [selectorMatchingA, topicUser],
    };
    const matchingSelectorB = {
      address: contractMatching,
      topics: [selectorMatchingB, topicUser],
    };
    const notMatchingTopic = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherUser],
    };
    const notMatchingContract = {
      address: contractOther,
      topics: [selectorMatchingA, topicUser],
    };

    await seedLogs([matchingSelectorA, matchingSelectorB, notMatchingTopic, notMatchingContract]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: null,
          topic1: { type: "userAddress" },
          topic2: null,
          topic3: null,
        },
      ],
      [matchingSelectorA, matchingSelectorB]
    );
  });

  it("ignores topic1 when it is null", async () => {
    const matchingTopic1A = {
      address: contractMatching,
      topics: [selectorMatchingA, topicExactA],
    };
    const matchingTopic1B = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA],
    };
    const notMatchingSelector = {
      address: contractMatching,
      topics: [selectorOtherA, topicExactA],
    };

    await seedLogs([matchingTopic1A, matchingTopic1B, notMatchingSelector]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: null,
          topic2: null,
          topic3: null,
        },
      ],
      [matchingTopic1A, matchingTopic1B]
    );
  });

  it("matches topic1 equalTo", async () => {
    const matchingTopic1 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicExactB],
    };
    const notMatchingTopic1 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA],
    };
    const notMatchingSelector = {
      address: contractMatching,
      topics: [selectorMatchingB, topicExactB],
    };

    await seedLogs([matchingTopic1, notMatchingTopic1, notMatchingSelector]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: { type: "equalTo", value: topicExactB },
          topic2: null,
          topic3: null,
        },
      ],
      [matchingTopic1]
    );
  });

  it("matches topic1 userAddress", async () => {
    const matchingTopic1 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicUser],
    };
    const notMatchingTopic1 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherUser],
    };

    await seedLogs([matchingTopic1, notMatchingTopic1]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: { type: "userAddress" },
          topic2: null,
          topic3: null,
        },
      ],
      [matchingTopic1]
    );
  });

  it("matches topic2 equalTo", async () => {
    const matchingTopic2 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicExactA],
    };
    const notMatchingTopic2 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicExactB],
    };

    await seedLogs([matchingTopic2, notMatchingTopic2]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: null,
          topic2: { type: "equalTo", value: topicExactA },
          topic3: null,
        },
      ],
      [matchingTopic2]
    );
  });

  it("matches topic2 userAddress", async () => {
    const matchingTopic2 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicUser],
    };
    const notMatchingTopic2 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicOtherUser],
    };

    await seedLogs([matchingTopic2, notMatchingTopic2]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: null,
          topic2: { type: "userAddress" },
          topic3: null,
        },
      ],
      [matchingTopic2]
    );
  });

  it("matches topic3 equalTo", async () => {
    const matchingTopic3 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicExactA, topicExactB],
    };
    const notMatchingTopic3 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicExactA, topicOtherB],
    };

    await seedLogs([matchingTopic3, notMatchingTopic3]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: null,
          topic2: { type: "equalTo", value: topicExactA },
          topic3: { type: "equalTo", value: topicExactB },
        },
      ],
      [matchingTopic3]
    );
  });

  it("matches topic3 userAddress", async () => {
    const matchingTopic3 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicExactA, topicUser],
    };
    const notMatchingTopic3 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicExactA, topicOtherUser],
    };

    await seedLogs([matchingTopic3, notMatchingTopic3]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: null,
          topic2: { type: "equalTo", value: topicExactA },
          topic3: { type: "userAddress" },
        },
      ],
      [matchingTopic3]
    );
  });

  it("matches by contractAddress only when all topics are null", async () => {
    const matchingA = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA],
    };
    const matchingB = {
      address: contractMatching,
      topics: [selectorOtherB, topicOtherB],
    };
    const notMatchingContract = {
      address: contractOther,
      topics: [selectorMatchingA, topicOtherA],
    };

    await seedLogs([matchingA, matchingB, notMatchingContract]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: null,
          topic1: null,
          topic2: null,
          topic3: null,
        },
      ],
      [matchingA, matchingB]
    );
  });

  it("matches different contract when rule points to that contract", async () => {
    const matchingOtherContract = {
      address: contractOther,
      topics: [selectorOtherA, topicUser],
    };
    const notMatchingMainContract = {
      address: contractMatching,
      topics: [selectorOtherA, topicUser],
    };

    await seedLogs([matchingOtherContract, notMatchingMainContract]);

    await assertRules(
      [
        {
          contractAddress: contractOther,
          topic0: selectorOtherA,
          topic1: { type: "userAddress" },
          topic2: null,
          topic3: null,
        },
      ],
      [matchingOtherContract]
    );
  });

  it("matches union of multiple rules", async () => {
    const matchingByRule1 = {
      address: contractMatching,
      topics: [selectorMatchingB, topicExactA],
    };
    const matchingByRule2 = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicUser],
    };
    const notMatchingAnyRule = {
      address: contractMatching,
      topics: [selectorMatchingA, topicOtherA, topicOtherUser],
    };

    await seedLogs([matchingByRule1, matchingByRule2, notMatchingAnyRule]);

    await assertRules(
      [
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingB,
          topic1: { type: "equalTo", value: topicExactA },
          topic2: null,
          topic3: null,
        },
        {
          contractAddress: contractMatching,
          topic0: selectorMatchingA,
          topic1: null,
          topic2: { type: "userAddress" },
          topic3: null,
        },
      ],
      [matchingByRule1, matchingByRule2]
    );
  });

  it("returns no logs when permission rules empty", async () => {
    await seedLogs([
      { address: contractMatching, topics: [selectorMatchingA, topicUser] },
      { address: contractOther, topics: [selectorOtherA, topicOtherA] },
    ]);
    fetchEventPermissionRules.mockResolvedValue([]);

    const res = await logService.findAll(
      { transactionHash: TX_HASH },
      { page: 1, limit: 1000, route: "transactions/tx/logs" },
      { user: makeUser() }
    );

    expect(res.items).toEqual([]);
    expect(fetchEventPermissionRules).toHaveBeenCalledWith("tok");
  });

  it("returns all logs when visibility is not provided", async () => {
    const logA = { address: contractMatching, topics: [selectorMatchingA, topicUser] };
    const logB = { address: contractOther, topics: [selectorOtherA, topicOtherA] };
    await seedLogs([logA, logB]);

    const res = await logService.findAll(
      { transactionHash: TX_HASH },
      { page: 1, limit: 1000, route: "transactions/tx/logs" }
    );

    expect(res.items).toMatchObject([logA, logB]);
    expect(fetchEventPermissionRules).not.toHaveBeenCalled();
  });

  it("returns no logs when user is missing in visibility", async () => {
    await seedLogs([{ address: contractMatching, topics: [selectorMatchingA, topicUser] }]);

    const res = await logService.findAll(
      { transactionHash: TX_HASH },
      { page: 1, limit: 1000, route: "transactions/tx/logs" },
      { user: undefined }
    );

    expect(res.items).toEqual([]);
    expect(fetchEventPermissionRules).not.toHaveBeenCalled();
  });

  it("returns no logs when user token is missing", async () => {
    await seedLogs([{ address: contractMatching, topics: [selectorMatchingA, topicUser] }]);

    const res = await logService.findAll(
      { transactionHash: TX_HASH },
      { page: 1, limit: 1000, route: "transactions/tx/logs" },
      { user: makeUser({ token: "" }) }
    );

    expect(res.items).toEqual([]);
    expect(fetchEventPermissionRules).not.toHaveBeenCalled();
  });

  it("propagates error when rules service fails", async () => {
    await seedLogs([{ address: contractMatching, topics: [selectorMatchingA, topicUser] }]);
    fetchEventPermissionRules.mockRejectedValueOnce(new Error("rules fetch failed"));

    await expect(
      logService.findAll(
        { transactionHash: TX_HASH },
        { page: 1, limit: 1000, route: "transactions/tx/logs" },
        { user: makeUser() }
      )
    ).rejects.toThrow("rules fetch failed");

    expect(fetchEventPermissionRules).toHaveBeenCalledWith("tok");
    expect(fetchEventPermissionRules).toHaveBeenCalledTimes(1);
  });

  it("returns all logs when admin", async () => {
    await seedLogs([
      { address: contractMatching, topics: [selectorMatchingA, topicUser] },
      { address: contractMatching, topics: [selectorMatchingB, topicOtherA] },
      { address: contractOther, topics: [selectorOtherA, topicOtherB] },
    ]);
    fetchEventPermissionRules.mockReset();
    const res = await logService.findAll(
      { transactionHash: TX_HASH },
      { page: 1, limit: 10, route: "transactions/tx/logs" },
      { user: makeUser({ isAdmin: true }) }
    );
    expect(res.items).toHaveLength(3);
    expect(fetchEventPermissionRules).not.toHaveBeenCalled();
  });
});
