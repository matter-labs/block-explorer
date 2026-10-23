import { Block, Log } from "ethers";
import { mock } from "jest-mock-extended";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { CONTRACT_INTERFACES, ETH_L1_ADDRESS } from "../../../constants";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { erc1155TransferSingleHandler } from "./erc1155TransferSingle.handler";

const OPERATOR = "0x1111111111111111111111111111111111111111";
const FROM = "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C";
const TO = "0x7AA5F26e03B12a78e3fF1C454547701443144C67";

describe("erc1155TransferSingleHandler", () => {
  let log: Log;
  let blockDetails: Block;
  let blockchainService: BlockchainService;

  const makeLog = (from: string, id: bigint, value: bigint): Log => {
    const { data, topics } = CONTRACT_INTERFACES.ERC1155.interface.encodeEventLog("TransferSingle", [
      OPERATOR,
      from,
      TO,
      id,
      value,
    ]);
    return mock<Log>({
      transactionIndex: 2,
      blockNumber: 3459471,
      transactionHash: "0x6bedb809e97f58d987aea7aad4fcfa8a3f5ecc3cde9a97093b2f3a1a170692a0",
      address: "0x89bcb56033920b8a654109fAEB1f87E0c3358cAD",
      topics,
      data,
      index: 1,
      blockHash: "0xfe02bd556b7abf14d1c92e823ed5b3b8d5067f94115531301f6ac5ebb7488a7e",
    });
  };

  beforeEach(() => {
    log = makeLog(FROM, BigInt(5), BigInt(12));
    blockDetails = mock<Block>({
      timestamp: new Date().getTime() / 1000,
    });
    blockchainService = mock<BlockchainService>();
  });

  describe("matches", () => {
    it("returns true if log has operator, from and to indexed", () => {
      const result = erc1155TransferSingleHandler.matches(log, null);
      expect(result).toBe(true);
    });

    it("returns false if log has a different number of topics", () => {
      log = mock<Log>({ ...log, topics: log.topics.slice(0, 3) });
      const result = erc1155TransferSingleHandler.matches(log, null);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    it("returns null when log cannot be parsed", async () => {
      log = mock<Log>({ ...log, data: "0x", topics: [] });
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result).toBeNull();
    });

    it("extracts transfer with lower cased from and to addresses", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.from).toBe(FROM.toLowerCase());
      expect(result.to).toBe(TO.toLowerCase());
    });

    it("extracts transfer with amount populated from value", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.amount).toBe(BigInt(12));
    });

    it("extracts transfer with populated tokenId and lower cased operator", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.fields).toEqual({ tokenId: BigInt(5), operator: OPERATOR.toLowerCase() });
    });

    it("extracts transfer with tokenAddress field populated with lower cased log address", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.tokenAddress).toBe("0x89bcb56033920b8a654109faeb1f87e0c3358cad");
    });

    it("extracts transfer of ERC1155 token type", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.tokenType).toBe(TokenType.ERC1155);
    });

    it("extracts transfer of transfer type if from address is not a zero address", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.type).toBe(TransferType.Transfer);
      expect(result.isFeeOrRefund).toBe(false);
    });

    it("extracts transfer of mint type with from equal to `to` if from address is a zero address", async () => {
      log = makeLog(ETH_L1_ADDRESS, BigInt(5), BigInt(12));
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.type).toBe(TransferType.Mint);
      expect(result.from).toBe(TO.toLowerCase());
    });

    it("extracts transfer with transaction and log details", async () => {
      const result = await erc1155TransferSingleHandler.extract(log, blockchainService, blockDetails);
      expect(result.transactionHash).toBe(log.transactionHash);
      expect(result.blockNumber).toBe(3459471);
      expect(result.logIndex).toBe(1);
      expect(result.transactionIndex).toBe(2);
      expect(result.timestamp).toEqual(new Date(blockDetails.timestamp * 1000));
    });
  });
});
