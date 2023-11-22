import { AddressTransaction } from "../../transaction/entities/addressTransaction.entity";
import { Transaction, TransactionStatus } from "../../transaction/entities/transaction.entity";
import { mapTransactionListItem } from "./transactionMapper";

describe("transactionMapper", () => {
  const addressTransaction = {
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
  } as AddressTransaction;

  describe("mapTransactionListItem", () => {
    it("transforms address transaction into transaction list item format", () => {
      expect(mapTransactionListItem(addressTransaction, 100)).toEqual({
        blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
        blockNumber: "20",
        commitTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b1",
        confirmations: "80",
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        cumulativeGasUsed: "1200000",
        executeTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b3",
        fee: "0",
        from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        functionName: "",
        gas: "1100000",
        gasPrice: "100",
        gasUsed: "900000",
        hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
        input: "0x",
        isError: "1",
        isL1Originated: "1",
        l1BatchNumber: "3",
        methodId: "0x",
        nonce: "1",
        proveTxHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b2",
        timeStamp: "1672531200",
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
        transactionIndex: "10",
        txreceipt_status: "1",
        value: "1000000",
        type: "255",
      });
    });

    it("sets isError as 1 when transaction is failed", () => {
      expect(
        mapTransactionListItem(
          {
            ...addressTransaction,
            transaction: {
              ...addressTransaction.transaction,
              status: TransactionStatus.Failed,
            } as Transaction,
          },
          100
        ).isError
      ).toBe("1");
    });

    it("sets isError as 0 when transaction is included", () => {
      expect(
        mapTransactionListItem(
          {
            ...addressTransaction,
            transaction: {
              ...addressTransaction.transaction,
              status: TransactionStatus.Included,
            } as Transaction,
          },
          100
        ).isError
      ).toBe("0");
    });

    it("sets isL1Originated as 1 when transaction is originated from L1", () => {
      expect(
        mapTransactionListItem(
          {
            ...addressTransaction,
            transaction: {
              ...addressTransaction.transaction,
              isL1Originated: true,
            } as Transaction,
          },
          100
        ).isL1Originated
      ).toBe("1");
    });

    it("sets isL1Originated as 0 when transaction is not originated from L1", () => {
      expect(
        mapTransactionListItem(
          {
            ...addressTransaction,
            transaction: {
              ...addressTransaction.transaction,
              isL1Originated: false,
            } as Transaction,
          },
          100
        ).isL1Originated
      ).toBe("0");
    });
  });
});
