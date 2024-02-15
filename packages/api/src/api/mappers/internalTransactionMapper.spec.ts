import { Transfer } from "../../transfer/transfer.entity";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { L2_ETH_TOKEN_ADDRESS } from "../../common/constants";
import { mapInternalTransactionListItem } from "./internalTransactionMapper";

describe("internalTransactionMapper", () => {
  const transfer = {
    blockNumber: 20,
    timestamp: new Date("2023-01-01"),
    transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
    from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
    to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
    amount: "1000000",
    tokenAddress: L2_ETH_TOKEN_ADDRESS,
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
      commitTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b1",
      proveTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b2",
      executeTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b3",
      isL1Originated: true,
      l1BatchNumber: 3,
      transactionReceipt: {
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        cumulativeGasUsed: "1200000",
        gasUsed: "900000",
      },
      type: 255,
    },
  } as Transfer;

  describe("mapInternalTransactionListItem", () => {
    it("transforms transfer into internal transaction list item format", () => {
      expect(mapInternalTransactionListItem(transfer)).toEqual({
        blockNumber: "20",
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        errCode: "",
        fee: "0",
        from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        gas: "1100000",
        gasUsed: "900000",
        hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
        input: "",
        isError: "1",
        l1BatchNumber: "3",
        timeStamp: "1672531200",
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
        traceId: "0",
        type: "call",
        value: "1000000",
        transactionType: "255",
      });
    });

    describe("when transfer does not have a corresponding transaction", () => {
      it("excludes fields depending on transaction", () => {
        expect(
          mapInternalTransactionListItem({
            ...transfer,
            transaction: undefined,
          } as Transfer)
        ).toEqual({
          blockNumber: "20",
          errCode: "",
          from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
          hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
          input: "",
          isError: "0",
          timeStamp: "1672531200",
          to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
          traceId: "0",
          type: "call",
          value: "1000000",
        });
      });
    });

    it("sets isError as 1 when transaction is failed", () => {
      expect(
        mapInternalTransactionListItem({
          ...transfer,
          transaction: {
            ...transfer.transaction,
            status: TransactionStatus.Failed,
          },
        } as Transfer).isError
      ).toBe("1");
    });

    it("sets isError as 0 when transaction is included", () => {
      expect(
        mapInternalTransactionListItem({
          ...transfer,
          transaction: {
            ...transfer.transaction,
            status: TransactionStatus.Included,
          },
        } as Transfer).isError
      ).toBe("0");
    });
  });
});
