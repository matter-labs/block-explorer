import { AbiCoder, Block, Log } from "ethers";
import { mock } from "jest-mock-extended";
import { BlockchainService } from "../../../blockchain/blockchain.service";
import { CONTRACT_INTERFACES, ETH_L1_ADDRESS } from "../../../constants";
import { TransferType } from "../../transfer.service";
import { TokenType } from "../../../token/token.service";
import { erc1155TransferBatchHandler } from "./erc1155TransferBatch.handler";

const OPERATOR = "0x1111111111111111111111111111111111111111";
const FROM = "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C";
const TO = "0x7AA5F26e03B12a78e3fF1C454547701443144C67";

describe("erc1155TransferBatchHandler", () => {
  let log: Log;
  let blockDetails: Block;
  let blockchainService: BlockchainService;

  const makeLog = (from: string, ids: bigint[], values: bigint[]): Log => {
    const { data, topics } = CONTRACT_INTERFACES.ERC1155.interface.encodeEventLog("TransferBatch", [
      OPERATOR,
      from,
      TO,
      ids,
      values,
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
    log = makeLog(FROM, [BigInt(5), BigInt(6)], [BigInt(12), BigInt(1)]);
    blockDetails = mock<Block>({
      timestamp: new Date().getTime() / 1000,
    });
    blockchainService = mock<BlockchainService>();
  });

  describe("matches", () => {
    it("returns true if log has operator, from and to indexed", () => {
      const result = erc1155TransferBatchHandler.matches(log, null);
      expect(result).toBe(true);
    });

    it("returns false if log has a different number of topics", () => {
      log = mock<Log>({ ...log, topics: log.topics.slice(0, 3) });
      const result = erc1155TransferBatchHandler.matches(log, null);
      expect(result).toBe(false);
    });
  });

  describe("extract", () => {
    it("returns null when log cannot be parsed", async () => {
      log = mock<Log>({ ...log, data: "0x", topics: [] });
      const result = await erc1155TransferBatchHandler.extract(log, blockchainService, blockDetails);
      expect(result).toBeNull();
    });

    it("returns null when ids and values have different lengths", async () => {
      log = mock<Log>({
        ...log,
        data: AbiCoder.defaultAbiCoder().encode(["uint256[]", "uint256[]"], [[BigInt(5), BigInt(6)], [BigInt(12)]]),
      });
      const result = await erc1155TransferBatchHandler.extract(log, blockchainService, blockDetails);
      expect(result).toBeNull();
    });

    it("returns an empty array when batch has no ids", async () => {
      log = makeLog(FROM, [], []);
      const result = await erc1155TransferBatchHandler.extract(log, blockchainService, blockDetails);
      expect(result).toEqual([]);
    });

    it("extracts a transfer per token id with matching amounts", async () => {
      const result = await erc1155TransferBatchHandler.extract(log, blockchainService, blockDetails);
      expect(result.map((transfer) => [transfer.fields.tokenId, transfer.amount])).toEqual([
        [BigInt(5), BigInt(12)],
        [BigInt(6), BigInt(1)],
      ]);
    });

    it("extracts transfers with the same log details", async () => {
      const result = await erc1155TransferBatchHandler.extract(log, blockchainService, blockDetails);
      for (const transfer of result) {
        expect(transfer).toMatchObject({
          from: FROM.toLowerCase(),
          to: TO.toLowerCase(),
          transactionHash: log.transactionHash,
          blockNumber: 3459471,
          tokenAddress: "0x89bcb56033920b8a654109faeb1f87e0c3358cad",
          type: TransferType.Transfer,
          tokenType: TokenType.ERC1155,
          isFeeOrRefund: false,
          logIndex: 1,
          transactionIndex: 2,
          timestamp: new Date(blockDetails.timestamp * 1000),
        });
      }
    });

    it("extracts transfers of mint type with from equal to `to` if from address is a zero address", async () => {
      log = makeLog(ETH_L1_ADDRESS, [BigInt(5)], [BigInt(12)]);
      const result = await erc1155TransferBatchHandler.extract(log, blockchainService, blockDetails);
      expect(result[0].type).toBe(TransferType.Mint);
      expect(result[0].from).toBe(TO.toLowerCase());
    });
  });
});
