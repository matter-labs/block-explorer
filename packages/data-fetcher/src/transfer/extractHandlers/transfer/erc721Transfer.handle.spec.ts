import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { ZERO_HASH_64 } from "../../../constants";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { erc721TransferHandler } from "./erc721Transfer.handler";

describe("erc721TransferHandler", () => {
  let log: types.Log;
  let blockDetails: types.BlockDetails;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 0,
      blockNumber: 3459471,
      transactionHash: "0x6bedb809e97f58d987aea7aad4fcfa8a3f5ecc3cde9a97093b2f3a1a170692a0",
      address: "0x89bcb56033920b8a654109fAEB1f87E0c3358cAD",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        "0x0000000000000000000000007AA5F26e03B12a78e3fF1C454547701443144C67",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ],
      data: "0x",
      index: 1,
      blockHash: "0xfe02bd556b7abf14d1c92e823ed5b3b8d5067f94115531301f6ac5ebb7488a7e",
    });
    blockDetails = mock<types.BlockDetails>({
      timestamp: new Date().getTime() / 1000,
    });
  });

  describe("matches", () => {
    it("returns true if transfer event is a ERC721 transfer event", () => {
      const result = erc721TransferHandler.matches(log);
      expect(result).toBe(true);
    });

    it("returns false if transfer event is a ERC20 transfer event", () => {
      log = mock<types.Log>({
        ...log,
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x000000000000000000000000d206eaf6819007535e893410cfa01885ce40e99a",
          "0x000000000000000000000000d754ff5e8a6f257e162f72578a4bb0493c0681d8",
        ],
      });
      const result = erc721TransferHandler.matches(log);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    it("extracts transfer with from field populated with lower cased from address if from log address is not a zero address", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.from).toBe("0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c");
    });

    it("extracts transfer with from equals to `to` address if from log address is a zero address", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) => (index === 1 ? ZERO_HASH_64 : val)),
      });
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.from).toBe("0x7aa5f26e03b12a78e3ff1c454547701443144c67");
    });

    it("extracts transfer with to field populated with lower cased to", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.to).toBe("0x7aa5f26e03b12a78e3ff1c454547701443144c67");
    });

    it("extracts transfer with populated transactionHash", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.transactionHash).toBe("0x6bedb809e97f58d987aea7aad4fcfa8a3f5ecc3cde9a97093b2f3a1a170692a0");
    });

    it("extracts transfer with populated blockNumber", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.blockNumber).toBe(3459471);
    });

    it("extracts transfer with undefined amount", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.amount).toBe(undefined);
    });

    it("extracts transfer with populated tokenId", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.fields).toBeDefined();
      expect(result.fields.tokenId).toStrictEqual(BigInt(1));
    });

    it("extracts transfer with tokenAddress field populated with lower cased log address", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe("0x89bcb56033920b8a654109faeb1f87e0c3358cad");
    });

    it("extracts transfer of ERC721 token type", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.tokenType).toBe(TokenType.ERC721);
    });

    it("extracts transfer of transfer type if from address is not a zero address", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Transfer);
    });

    it("adds isFeeOrRefund as false", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer of mint type if from address is a zero address", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) => (index === 1 ? ZERO_HASH_64 : val)),
      });
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Mint);
    });

    it("extracts transfer with logIndex populated from log", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts transfer with transactionIndex populated from log", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp", () => {
      const result = erc721TransferHandler.extract(log, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equals to transaction receivedAt", () => {
        const result = erc721TransferHandler.extract(log, blockDetails, transactionDetails);
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
