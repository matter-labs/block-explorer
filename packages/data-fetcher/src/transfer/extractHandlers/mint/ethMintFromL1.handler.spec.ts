import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { ethMintFromL1Handler } from "./ethMintFromL1.handler";
import { BASE_TOKEN_ADDRESS } from "../../../constants";

describe("ethMintFromL1Handler", () => {
  let log: types.Log;
  let blockDetails: types.BlockDetails;
  let blockchainService: BlockchainService;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 215276,
      transactionHash: "0x7cc7cc0326af164b15de04de3b153a7a55afb14a7897298a0a84f9507d483d1d",
      address: "0x000000000000000000000000000000000000800A",
      topics: [
        "0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885",
        "0x000000000000000000000000d206eaf6819007535e893410cfa01885ce40e99a",
      ],
      data: "0x00000000000000000000000000000000000000000000000006f05b59d3b20000",
      index: 3,
      blockHash: "0xaffcd3be150860bd92d03ff84eabda953de0001bf4f7ce81d8fa7349ee023859",
    });
    blockDetails = mock<types.BlockDetails>({
      timestamp: new Date().getTime() / 1000,
    });
    blockchainService = mock<BlockchainService>();
  });

  describe("matches", () => {
    it("returns true if log address is ETH token address", () => {
      const result = ethMintFromL1Handler.matches(log);
      expect(result).toBe(true);
    });

    it("returns false is log address is not ETH token address", async () => {
      log = mock<types.Log>({
        ...log,
        address: "0x000000000000000000000000000000000000800B",
      });
      const result = ethMintFromL1Handler.matches(log);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    it("extracts transfer with from field populated with lower cased account", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.from).toBe("0xd206eaf6819007535e893410cfa01885ce40e99a");
    });

    it("extracts transfer with to field populated with lower cased account", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.to).toBe("0xd206eaf6819007535e893410cfa01885ce40e99a");
    });

    it("extracts transfer with populated transactionHash", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.transactionHash).toBe("0x7cc7cc0326af164b15de04de3b153a7a55afb14a7897298a0a84f9507d483d1d");
    });

    it("extracts transfer with populated blockNumber", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.blockNumber).toBe(215276);
    });

    it("extracts transfer with tokenType as ETH", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.tokenType).toBe(TokenType.BaseToken);
    });

    it("extracts transfer with populated amount", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.amount).toStrictEqual(BigInt("0x6f05b59d3b20000"));
    });

    it("extracts transfer with L2_ETH_TOKEN_ADDRESS as tokenAddress", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.tokenAddress).toBe(BASE_TOKEN_ADDRESS);
    });

    it("extracts transfer of deposit type", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.type).toBe(TransferType.Deposit);
    });

    it("adds isFeeOrRefund as false", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer with logIndex populated from log", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts transfer with transactionIndex populated from log", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.transactionIndex).toBe(log.transactionIndex);
    });

    it("extracts transfer with block timestamp", async () => {
      const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });

    describe("when transaction details are specified", () => {
      const receivedAt = new Date();
      const transactionDetails = mock<types.TransactionDetails>();
      transactionDetails.receivedAt = receivedAt;

      it("extracts transfer with timestamp equals to transaction receivedAt", async () => {
        const result = await ethMintFromL1Handler.extract(log, blockchainService, blockDetails, transactionDetails);
        expect(result.timestamp).toBe(receivedAt);
      });
    });
  });
});
