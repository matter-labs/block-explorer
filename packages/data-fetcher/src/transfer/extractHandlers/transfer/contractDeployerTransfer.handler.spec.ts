import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { contractDeployerTransferHandler } from "./contractDeployerTransfer.handler";

describe("contractDeployerTransferHandler", () => {
  let log: types.Log;
  let txReceipt: types.TransactionReceipt;
  let blockDetails: types.BlockDetails;
  beforeEach(() => {
    txReceipt = mock<types.TransactionReceipt>({
      to: "0x0000000000000000000000000000000000008006",
    });

    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 3233097,
      transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000007AA5F26e03B12a78e3fF1C454547701443144C67",
      ],
      data: "0x000000000000000000000000000000000000000000000000016345785d8a0000",
      index: 13,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
    });

    blockDetails = mock<types.BlockDetails>({
      timestamp: new Date().getTime() / 1000,
    });
  });

  describe("matches", () => {
    it("returns true if txReceipt.to is a contract deployer address and log from is zero address", () => {
      const result = contractDeployerTransferHandler.matches(log, txReceipt);
      expect(result).toBe(true);
    });

    it("returns true if txReceipt.to is a contract deployer address and transfer log does not have indexed values", () => {
      log = mock<types.Log>({
        ...log,
        topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
      });
      const result = contractDeployerTransferHandler.matches(log, txReceipt);
      expect(result).toBe(true);
    });

    it("returns false if txReceipt.to is not a contract deployer address", () => {
      txReceipt = mock<types.TransactionReceipt>({
        ...txReceipt,
        to: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      });
      const result = contractDeployerTransferHandler.matches(log, txReceipt);
      expect(result).toBe(false);
    });

    it("returns false if log from is not a zero address", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 1 ? "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C" : val
        ),
      });
      const result = contractDeployerTransferHandler.matches(log, txReceipt);
      expect(result).toBe(false);
    });

    it("returns false if txReceipt is null", () => {
      const result = contractDeployerTransferHandler.matches(log, null);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    describe("when there are no indexed values in the transfer", () => {
      beforeEach(() => {
        log = mock<types.Log>({
          ...log,
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
          data: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000934f351e49800ff7d72b63d11d12ea0027e5730200000000000000000000000000000000000000000000152d02c7e14af6800000",
        });
      });

      it("extracts transfer with from field populated with lower cased to", () => {
        const result = contractDeployerTransferHandler.extract(log, blockDetails);
        expect(result.from).toBe("0x934f351e49800ff7d72b63d11d12ea0027e57302");
      });

      it("extracts transfer with to field populated with lower cased to", () => {
        const result = contractDeployerTransferHandler.extract(log, blockDetails);
        expect(result.to).toBe("0x934f351e49800ff7d72b63d11d12ea0027e57302");
      });
    });

    it("extracts transfer with from field populated with lower cased to", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.from).toBe("0x7aa5f26e03b12a78e3ff1c454547701443144c67");
    });

    it("extracts transfer with to field populated with lower cased to", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.to).toBe("0x7aa5f26e03b12a78e3ff1c454547701443144c67");
    });

    it("extracts transfer with populated transactionHash", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.transactionHash).toBe("0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0");
    });

    it("extracts transfer with populated blockNumber", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.blockNumber).toBe(3233097);
    });

    it("extracts transfer with populated amount", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.amount).toStrictEqual(BigInt("0x016345785d8a0000"));
    });

    it("extracts transfer with tokenAddress field populated with lower cased log address", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe("0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c");
    });

    it("extracts transfer of mint type", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Mint);
    });

    it("extracts transfer with ERC20 token type", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.tokenType).toBe(TokenType.ERC20);
    });

    it("adds isFeeOrRefund as false", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer with logIndex populated from log", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts transfer with transactionIndex populated from log", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp", () => {
      const result = contractDeployerTransferHandler.extract(log, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equals to transaction receivedAt", () => {
        const result = contractDeployerTransferHandler.extract(log, blockDetails, transactionDetails);
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
