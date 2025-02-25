import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { ethWithdrawalToL1Handler } from "./ethWithdrawalToL1.handler";
import { BASE_TOKEN_ADDRESS } from "../../../constants";

describe("ethWithdrawalToL1Handler", () => {
  let log: types.Log;
  let blockDetails: types.BlockDetails;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 7,
      blockNumber: 258521,
      transactionHash: "0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f",
      address: "0x000000000000000000000000000000000000800A",
      topics: [
        "0x2717ead6b9200dd235aad468c9809ea400fe33ac69b5bfaa6d3e90fc922b6398",
        "0x000000000000000000000000d754ff5e8a6f257e162f72578a4bb0493c0681d8",
        "0x000000000000000000000000d206eaf6819007535e893410cfa01885ce40e99a",
      ],
      data: "0x0000000000000000000000000000000000000000000000000429d069189e0000",
      index: 43,
      blockHash: "0x15543afe64eaa6f26beca9cac8dd5c3465e532bd55f3402365a67eac8f62fa6b",
    });
    blockDetails = mock<types.BlockDetails>({
      timestamp: new Date().getTime() / 1000,
    });
  });

  describe("matches", () => {
    it("returns true if log address is ETH token address", () => {
      const result = ethWithdrawalToL1Handler.matches(log);
      expect(result).toBe(true);
    });

    it("returns false is log address is not ETH token address", () => {
      log = mock<types.Log>({
        ...log,
        address: "0x000000000000000000000000000000000000800B",
      });
      const result = ethWithdrawalToL1Handler.matches(log);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    it("extracts transfer with from field populated with lower cased _l2Sender", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.from).toBe("0xd754ff5e8a6f257e162f72578a4bb0493c0681d8");
    });

    it("extracts transfer with to field populated with lower cased _l1Receiver", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.to).toBe("0xd206eaf6819007535e893410cfa01885ce40e99a");
    });

    it("extracts transfer with populated transactionHash", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.transactionHash).toBe("0x33bfd18a0aea94ba39742a9a1df595462322ecbbb25c0f767a0bf6acb41dfb2f");
    });

    it("extracts transfer with populated blockNumber", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.blockNumber).toBe(258521);
    });

    it("extracts transfer with populated amount", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.amount).toStrictEqual(BigInt("0x429d069189e0000"));
    });

    it("extracts transfer with L2_ETH_TOKEN_ADDRESS as tokenAddress", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.tokenAddress).toBe(BASE_TOKEN_ADDRESS);
    });

    it("extracts transfer of deposit type", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.type).toBe(TransferType.Withdrawal);
    });

    it("extracts transfer of ETH token type", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.tokenType).toBe(TokenType.BaseToken);
    });

    it("adds isFeeOrRefund as false", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer with logIndex populated from log", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts transfer with transactionIndex populated from log", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp", () => {
      const result = ethWithdrawalToL1Handler.extract(log, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equals to transaction receivedAt", () => {
        const result = ethWithdrawalToL1Handler.extract(log, blockDetails, transactionDetails);
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
