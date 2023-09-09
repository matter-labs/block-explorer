import { Batch } from "../batch/batch.entity";
import { Transaction } from "../transaction/entities/transaction.entity";
import { getQueryString, isCounterSupported } from "./counter.utils";

describe("Counter utils", () => {
  describe("getQueryString", () => {
    it("returns sorted query string from filters object", () => {
      const filters = {
        blockNumber: "321",
        "from|to": "123",
        nullable: null,
        undefined: undefined,
      };
      expect(getQueryString(filters)).toBe("blockNumber=321&from%7Cto=123&nullable=null&undefined=undefined");
    });
  });

  describe("isCounterSupported", () => {
    it("returns false when table is not supported", () => {
      expect(isCounterSupported<Batch>("batches", {})).toBe(false);
    });

    it("returns false when counter criteria is not supported", () => {
      expect(isCounterSupported<Transaction>("transactions", { from: "123" })).toBe(false);
      expect(isCounterSupported<Transaction>("transactions", { from: "123", to: "321" })).toBe(false);
    });

    it("returns true when table is supported and criteria is empty", () => {
      expect(isCounterSupported<Transaction>("transactions", {})).toBe(true);
    });

    it("returns true when table is supported and criteria is supported", () => {
      expect(isCounterSupported<Transaction>("transactions", { "from|to": "123" })).toBe(true);
    });
  });
});
