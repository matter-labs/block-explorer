import { types } from "zksync-ethers";
import { mock } from "jest-mock-extended";
import { defaultContractDeployedHandler } from "./default.handler";

describe("defaultContractDeployedHandler", () => {
  let log: types.Log;
  beforeEach(() => {
    log = mock<types.Log>({
      transactionIndex: 1,
      blockNumber: 3233097,
      transactionHash: "0x5e018d2a81dbd1ef80ff45171dd241cb10670dcb091e324401ff8f52293841b0",
      address: "0x0000000000000000000000000000000000008006",
      topics: [
        "0x290afdae231a3fc0bbae8b1af63698b0a1d79b21ad17df0342dfb952fe74f8e5",
        "0x000000000000000000000000c7e0220d02d549c4846a6ec31d89c3b670ebe35c",
        "0x0100014340e955cbf39159da998b3374bee8f3c0b3c75a7a9e3df6b85052379d",
        "0x000000000000000000000000dc187378edd8ed1585fb47549cc5fe633295d571",
      ],
      data: "0x",
      index: 8,
      blockHash: "0xdfd071dcb9c802f7d11551f4769ca67842041ffb81090c49af7f089c5823f39c",
      l1BatchNumber: 604161,
    });
  });

  describe("matches", () => {
    it("returns true", () => {
      const result = defaultContractDeployedHandler.matches(log);
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

    it("extracts deployed contract address", () => {
      const result = defaultContractDeployedHandler.extract(log, transactionReceipt);
      expect(result.address).toBe("0xdc187378edD8Ed1585fb47549Cc5fe633295d571");
    });

    it("extracts block number for the created contract", () => {
      const result = defaultContractDeployedHandler.extract(log, transactionReceipt);
      expect(result.blockNumber).toBe(transactionReceipt.blockNumber);
    });

    it("extracts transaction hash for the created contract", () => {
      const result = defaultContractDeployedHandler.extract(log, transactionReceipt);
      expect(result.transactionHash).toBe(transactionReceipt.hash);
    });

    it("extracts creator address for the created contract", () => {
      const result = defaultContractDeployedHandler.extract(log, transactionReceipt);
      expect(result.creatorAddress).toBe(transactionReceipt.from);
    });

    it("extracts logIndex for the created contract", () => {
      const result = defaultContractDeployedHandler.extract(log, transactionReceipt);
      expect(result.logIndex).toBe(log.index);
    });
  });
});
