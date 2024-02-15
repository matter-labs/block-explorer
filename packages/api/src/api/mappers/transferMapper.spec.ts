import { Transfer } from "../../transfer/transfer.entity";
import { TransactionStatus } from "../../transaction/entities/transaction.entity";
import { mapTransferListItem } from "./transferMapper";

describe("transferMapper", () => {
  const transfer = {
    blockNumber: 20,
    timestamp: new Date("2023-01-01"),
    transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
    from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
    to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
    amount: "1000000",
    tokenAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
    token: {
      name: "Token",
      symbol: "TKN",
      decimals: 18,
    },
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
      type: 255,
      transactionReceipt: {
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        cumulativeGasUsed: "1200000",
        gasUsed: "900000",
      },
    },
  } as Transfer;

  describe("mapTransferListItem", () => {
    it("transforms transfer into transfer list item format", () => {
      expect(mapTransferListItem(transfer, 100)).toEqual({
        blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
        blockNumber: "20",
        confirmations: "80",
        contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
        cumulativeGasUsed: "1200000",
        fee: "0",
        from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        gas: "1100000",
        gasPrice: "100",
        gasUsed: "900000",
        hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
        input: "0x",
        l1BatchNumber: "3",
        nonce: "1",
        timeStamp: "1672531200",
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
        tokenDecimal: "18",
        tokenName: "Token",
        tokenSymbol: "TKN",
        transactionIndex: "10",
        value: "1000000",
        transactionType: "255",
      });
    });

    describe("when transfer does not have a corresponding transaction", () => {
      it("excludes fields depending on transaction", () => {
        expect(
          mapTransferListItem(
            {
              ...transfer,
              transaction: undefined,
            } as Transfer,
            100
          )
        ).toEqual({
          blockNumber: "20",
          confirmations: "80",
          contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
          from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
          hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
          timeStamp: "1672531200",
          to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
          tokenDecimal: "18",
          tokenName: "Token",
          tokenSymbol: "TKN",
          value: "1000000",
        });
      });
    });

    describe("when transfer does not have a corresponding token", () => {
      it("excludes fields depending on token", () => {
        expect(
          mapTransferListItem(
            {
              ...transfer,
              transaction: undefined,
              token: undefined,
            } as Transfer,
            100
          )
        ).toEqual({
          blockNumber: "20",
          confirmations: "80",
          contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
          from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
          hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
          timeStamp: "1672531200",
          to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
          value: "1000000",
        });
      });
    });

    describe("when transfer is an NFT transfer", () => {
      it("adds tokenID field", () => {
        expect(
          mapTransferListItem(
            {
              ...transfer,
              fields: {
                tokenId: "123",
              },
            } as unknown as Transfer,
            100
          )
        ).toEqual({
          blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
          blockNumber: "20",
          confirmations: "80",
          contractAddress: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35E",
          cumulativeGasUsed: "1200000",
          fee: "0",
          from: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
          gas: "1100000",
          gasPrice: "100",
          gasUsed: "900000",
          hash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
          input: "0x",
          l1BatchNumber: "3",
          nonce: "1",
          timeStamp: "1672531200",
          to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35D",
          tokenDecimal: "18",
          tokenID: "123",
          tokenName: "Token",
          tokenSymbol: "TKN",
          transactionIndex: "10",
          value: "1000000",
          transactionType: "255",
        });
      });
    });

    describe("when transfer amount is NULL", () => {
      it("sets value as undefined", () => {
        expect(
          mapTransferListItem(
            {
              ...transfer,
              amount: null,
            } as unknown as Transfer,
            100
          ).value
        ).toBe(undefined);
      });
    });
  });
});
