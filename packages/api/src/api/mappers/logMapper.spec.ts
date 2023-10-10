import { mock } from "jest-mock-extended";
import { mapLogListItem } from "./logMapper";
import { Log } from "../../log/log.entity";
import { Transaction } from "../../transaction/entities/transaction.entity";
import { TransactionReceipt } from "../../transaction/entities/transactionReceipt.entity";

describe("mapLogListItem", () => {
  let log: Log = {
    address: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
    data: "0x123",
    blockNumber: 10,
    transactionHash: "0x4ffd22d986913d33927a392fe4319bcd2b62f3afe1c15a2c59f77fc2cc4c20a9",
    transactionIndex: 2,
    logIndex: 1,
    timestamp: new Date("2023-10-08T20:23:42.988Z"),
    transaction: mock<Transaction>({
      gasPrice: "123",
      transactionReceipt: mock<TransactionReceipt>({
        gasUsed: "234",
      }),
    }),
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x000000000000000000000000c45a4b3b698f21f88687548e7f5a80df8b99d93d",
    ],
  } as unknown as Log;

  it("returns mapped log entity", () => {
    const result = mapLogListItem(log);
    expect(result).toEqual({
      address: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
      blockNumber: "0xa",
      data: "0x123",
      gasPrice: "0x7b",
      gasUsed: "0xea",
      logIndex: "0x1",
      timeStamp: "0x65230fce",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000c45a4b3b698f21f88687548e7f5a80df8b99d93d",
      ],
      transactionHash: "0x4ffd22d986913d33927a392fe4319bcd2b62f3afe1c15a2c59f77fc2cc4c20a9",
      transactionIndex: "0x2",
    });
  });

  describe("when there is no transaction for the log", () => {
    beforeEach(() => {
      log = {
        ...log,
        transaction: undefined,
      } as Log;
    });

    it("returns mapped log entity with no transaction values", () => {
      const result = mapLogListItem(log);
      expect(result).toEqual({
        address: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
        blockNumber: "0xa",
        data: "0x123",
        gasPrice: "0x",
        gasUsed: "0x",
        logIndex: "0x1",
        timeStamp: "0x65230fce",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x000000000000000000000000c45a4b3b698f21f88687548e7f5a80df8b99d93d",
        ],
        transactionHash: "0x4ffd22d986913d33927a392fe4319bcd2b62f3afe1c15a2c59f77fc2cc4c20a9",
        transactionIndex: "0x2",
      });
    });
  });
});
