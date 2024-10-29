import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { defaultTransferHandler } from "./default.handler";
import { BASE_TOKEN_ADDRESS } from "../../../../src/constants";
describe("defaultTransferHandler", () => {
  let log: types.Log;
  let blockDetails: types.BlockDetails;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 3233097,
      transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
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
    describe("if there are 2 indexed topic values", () => {
      beforeEach(() => {
        log = mock<types.Log>({
          ...log,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            "0x0000000000000000000000007AA5F26e03B12a78e3fF1C454547701443144C67",
          ],
        });
      });

      it("returns true", () => {
        const result = defaultTransferHandler.matches(log);
        expect(result).toBe(true);
      });
    });

    describe("if there are less than 2 indexed topic values", () => {
      beforeEach(() => {
        log = mock<types.Log>({
          ...log,
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
        });
      });

      it("returns false", () => {
        const result = defaultTransferHandler.matches(log);
        expect(result).toBe(false);
      });
    });

    describe("if there are more than 2 indexed topic values", () => {
      beforeEach(() => {
        log = mock<types.Log>({
          ...log,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
            "0x0000000000000000000000007AA5F26e03B12a78e3fF1C454547701443144C67",
            "0x0000000000000000000000007AA5F26e03B12a78e3fF1C454547701443144C67",
          ],
        });
      });

      it("returns false", () => {
        const result = defaultTransferHandler.matches(log);
        expect(result).toBe(false);
      });
    });
  });

  describe("extract", () => {
    it("extracts transfer with from field populated with lower cased from", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.from).toBe("0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c");
    });

    it("extracts transfer with to field populated with lower cased to", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.to).toBe("0x7aa5f26e03b12a78e3ff1c454547701443144c67");
    });

    it("extracts transfer with populated transactionHash", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.transactionHash).toBe("0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0");
    });

    it("extracts transfer with populated blockNumber", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.blockNumber).toBe(3233097);
    });

    it("extracts transfer with populated amount", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.amount).toStrictEqual(BigInt("0x016345785d8a0000"));
    });

    it("extracts transfer with 0x000000000000000000000000000000000000800a as a tokenAddress if log address is 0x000000000000000000000000000000000000800a", () => {
      log = mock<types.Log>({
        ...log,
        address: BASE_TOKEN_ADDRESS,
      });
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe(BASE_TOKEN_ADDRESS);
      expect(result.tokenType).toBe(TokenType.BaseToken);
    });

    it("extracts transfer with tokenAddress field populated with lower cased log address", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe("0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c");
      expect(result.tokenType).toBe(TokenType.ERC20);
    });

    it("extracts transfer of fee type if to address is a bootloader address", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 2 ? "0x0000000000000000000000000000000000000000000000000000000000008001" : val
        ),
      });
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Fee);
    });

    it("adds isFeeOrRefund as true if to address is a bootloader address", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 2 ? "0x0000000000000000000000000000000000000000000000000000000000008001" : val
        ),
      });
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(true);
    });

    it("extracts transfer of refund type if from address is a bootloader address and there are transaction details", () => {
      const transactionDetails = mock<types.TransactionDetails>();
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 1 ? "0x0000000000000000000000000000000000000000000000000000000000008001" : val
        ),
      });
      const result = defaultTransferHandler.extract(log, blockDetails, transactionDetails);
      expect(result.type).toBe(TransferType.Refund);
    });

    it("extracts transfer of transfer type if from address is a bootloader address and there are no transaction details", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 1 ? "0x0000000000000000000000000000000000000000000000000000000000008001" : val
        ),
      });
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Transfer);
    });

    it("adds isFeeOrRefund as true if from address is a bootloader address and there are transaction details", () => {
      const transactionDetails = mock<types.TransactionDetails>();
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 1 ? "0x0000000000000000000000000000000000000000000000000000000000008001" : val
        ),
      });
      const result = defaultTransferHandler.extract(log, blockDetails, transactionDetails);
      expect(result.isFeeOrRefund).toBe(true);
    });

    it("adds isFeeOrRefund as false if from address is a bootloader address and there are no transaction details", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) =>
          index === 1 ? "0x0000000000000000000000000000000000000000000000000000000000008001" : val
        ),
      });
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer of transfer type if neither to address nor from address is a bootload address", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Transfer);
    });

    it("adds isFeeOrRefund as false if neither to address nor from address is a bootload address", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer with logIndex populated from log", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts transfer with transactionIndex populated from log", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp", () => {
      const result = defaultTransferHandler.extract(log, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equals to transaction receivedAt", () => {
        const result = defaultTransferHandler.extract(log, blockDetails, transactionDetails);
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
