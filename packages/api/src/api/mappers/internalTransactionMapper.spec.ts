import { InternalTransaction } from "../../transaction/entities/internalTransaction.entity";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { BASE_TOKEN_L2_ADDRESS } from "../../common/constants";
import { mapInternalTransactionListItem } from "./internalTransactionMapper";

describe("internalTransactionMapper", () => {
  const internalTransaction = {
    id: 1,
    blockNumber: 20,
    timestamp: "2023-01-01T00:00:00.000Z",
    transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
    from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
    to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
    value: "1000000",
    gas: 1100000,
    gasUsed: 900000,
    input: "0x",
    type: "CALL",
    callType: "call",
    traceAddress: "0",
    traceIndex: 0,
    error: undefined,
    transaction: {
      blockNumber: 20,
      receivedAt: new Date("2023-01-01"),
      hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      nonce: 1,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
      transactionIndex: 10,
      from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
      value: "1000000",
      gasLimit: "1100000",
      gasPrice: "100",
      status: TransactionStatus.Failed,
      receiptStatus: 1,
      data: "0x",
      fee: "0x0",
      isL1Originated: true,
      transactionReceipt: {
        cumulativeGasUsed: "1200000",
        gasUsed: "900000",
      },
      type: 255,
    },
  } as InternalTransaction;

  describe("mapInternalTransactionListItem", () => {
    it("transforms internal transaction into internal transaction list item format", () => {
      expect(mapInternalTransactionListItem(internalTransaction)).toEqual({
        blockNumber: "20",
        contractAddress: undefined,
        errCode: "",
        fee: "0",
        from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        gas: "1100000",
        gasUsed: "900000",
        hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
        input: "0x",
        isError: "0",
        timeStamp: "1672531200",
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
        traceId: "0",
        type: "call",
        value: "1000000",
        transactionType: "255",
      });
    });

    describe("when internal transaction does not have a corresponding transaction", () => {
      it("excludes fields depending on transaction", () => {
        expect(
          mapInternalTransactionListItem({
            ...internalTransaction,
            transaction: undefined,
          } as InternalTransaction)
        ).toEqual({
          blockNumber: "20",
          errCode: "",
          from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
          gas: "1100000",
          gasUsed: "900000",
          hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
          input: "0x",
          isError: "0",
          timeStamp: "1672531200",
          to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
          traceId: "0",
          type: "call",
          value: "1000000",
        });
      });
    });

    it("sets isError as 1 when internal transaction has error", () => {
      expect(
        mapInternalTransactionListItem({
          ...internalTransaction,
          error: "Execution reverted",
        } as InternalTransaction).isError
      ).toBe("1");
    });

    it("sets isError as 0 when internal transaction has no error", () => {
      expect(
        mapInternalTransactionListItem({
          ...internalTransaction,
          error: undefined,
        } as InternalTransaction).isError
      ).toBe("0");
    });
  });
});
