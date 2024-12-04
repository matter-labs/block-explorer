import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { defaultContractUpgradableHandler } from "./default.handler";

describe("defaultContractUpgradableHandler", () => {
  let log: types.Log;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 3233097,
      transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      address: "0x1BEB2aBb1678D8a25431d9728A425455f29d12B7",
      topics: [
        "0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b",
        "0x000000000000000000000000a1810a1f32F4DC6c5112b5b837b6975E56b489cc",
      ],
      data: "0x",
      index: 8,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
      l1BatchNumber: 604161,
    });
  });

  describe("matches", () => {
    it("returns true", () => {
      const result = defaultContractUpgradableHandler.matches(log);
      expect(result).toBe(true);
    });
  });

  describe("extract", () => {
    let transactionReceipt;

    beforeEach(() => {
      transactionReceipt = mock<types.TransactionReceipt>({
        blockNumber: 10,
        hash: "transactionHash",
        from: "from",
      });
    });

    it("extracts upgraded contract address", () => {
      const result = defaultContractUpgradableHandler.extract(log, transactionReceipt);
      expect(result.address).toBe("0x1BEB2aBb1678D8a25431d9728A425455f29d12B7");
    });

    it("extracts block number for the upgraded contract", () => {
      const result = defaultContractUpgradableHandler.extract(log, transactionReceipt);
      expect(result.blockNumber).toBe(transactionReceipt.blockNumber);
    });

    it("extracts transaction hash for the upgraded contract", () => {
      const result = defaultContractUpgradableHandler.extract(log, transactionReceipt);
      expect(result.transactionHash).toBe(transactionReceipt.hash);
    });

    it("extracts creator address for the upgraded contract", () => {
      const result = defaultContractUpgradableHandler.extract(log, transactionReceipt);
      expect(result.creatorAddress).toBe(transactionReceipt.from);
    });

    it("extracts logIndex for the upgraded contract", () => {
      const result = defaultContractUpgradableHandler.extract(log, transactionReceipt);
      expect(result.logIndex).toBe(log.index);
    });

    it("extracts implementation address for the upgraded contract", () => {
      const result = defaultContractUpgradableHandler.extract(log, transactionReceipt);
      expect(result.implementationAddress).toBe("0xa1810a1f32F4DC6c5112b5b837b6975E56b489cc");
    });
  });
});
