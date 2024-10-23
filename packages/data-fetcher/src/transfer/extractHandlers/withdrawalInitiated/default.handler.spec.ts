import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { ZERO_HASH_64 } from "../../../constants";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { defaultWithdrawalInitiatedHandler } from "./default.handler";
import { BASE_TOKEN_ADDRESS } from "../../../../src/constants";

describe("defaultWithdrawalInitiatedHandler", () => {
  let log: types.Log;
  let blockDetails: types.BlockDetails;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 3233097,
      transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      address: "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
      topics: [
        "0x2fc3848834aac8e883a2d2a17a7514dc4f2d3dd268089df9b9f5d918259ef3b0",
        "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        "0x000000000000000000000000c7e0220d02d549c4846A6EC31D89C3B670Ebe35C",
        "0x000000000000000000000000dc187378edD8Ed1585fb47549Cc5fe633295d571",
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
    it("returns true", () => {
      const result = defaultWithdrawalInitiatedHandler.matches(null);
      expect(result).toBe(true);
    });
  });

  describe("extract", () => {
    it("extracts transfer with from field populated with lower cased l2Sender", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.from).toBe("0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c");
    });

    it("extracts transfer with to field populated with lower cased l1Receiver", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.to).toBe("0xc7e0220d02d549c4846a6ec31d89c3b670ebe35c");
    });

    it("extracts transfer with populated transactionHash", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.transactionHash).toBe("0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0");
    });

    it("extracts transfer with populated blockNumber", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.blockNumber).toBe(3233097);
    });

    it("extracts transfer with populated amount", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.amount).toStrictEqual(BigInt("0x016345785d8a0000"));
    });

    it("extracts transfer with L2_ETH_TOKEN_ADDRESS as a tokenAddress if l2Token is 0x0000000000000000000000000000000000000000", () => {
      log = mock<types.Log>({
        ...log,
        topics: log.topics.map((val, index) => (index === 3 ? ZERO_HASH_64 : val)),
      });
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe(BASE_TOKEN_ADDRESS);
      expect(result.tokenType).toBe(TokenType.BaseToken);
    });

    it("extracts transfer with tokenAddress field populated with lower cased l2Token", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe("0xdc187378edd8ed1585fb47549cc5fe633295d571");
      expect(result.tokenType).toBe(TokenType.ERC20);
    });

    it("extracts transfer of deposit type", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Withdrawal);
    });

    it("adds isFeeOrRefund as false", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer with logIndex populated from log", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts transfer with transactionIndex populated from log", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp", () => {
      const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equals to transaction receivedAt", () => {
        const result = defaultWithdrawalInitiatedHandler.extract(log, blockDetails, transactionDetails);
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
