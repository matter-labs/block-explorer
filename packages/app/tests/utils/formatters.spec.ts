import { describe, expect, it } from "vitest";

import type { Address } from "@/types";

import {
  checksumAddress,
  convert,
  formatBigNumberish,
  formatHexDecimals,
  formatMoney,
  formatPrice,
  formatPricePretty,
  formatWithSpaces,
  numberToHexString,
  shortValue,
  stringFromAsciiArray,
} from "@/utils/formatters";

describe("formatters:", () => {
  it("returns formatted number with spaces", () => {
    expect(formatWithSpaces(20300)).toBe("20 300");
  });
  it("returns formatted number with symbols", () => {
    expect(formatMoney(20300)).toBe("$20,300.0");
    expect(formatMoney(2000000)).toBe("$2,000,000.0");
  });
  it("returns shorted value", () => {
    expect(shortValue("0xb989b65e02b")).toBe("0xb989...e02b");
    expect(shortValue("0xb989b6", 8)).toBe("0xb9...89b6");
  });
  it("returns formatted price", () => {
    expect(formatPrice(3500)).toBe("$3,500.00");
  });
  it("returns formatted string from ascii", () => {
    expect(stringFromAsciiArray([])).toBe("");
    expect(stringFromAsciiArray([69, 84, 72])).toBe("ETH");
  });
  it("returns correct amount from big numberish", () => {
    expect(formatBigNumberish("10000000", 18)).toBe("0.00000000001");
    expect(formatBigNumberish("10000000", 1)).toBe("1000000");
  });
  it("returns checksum address", () => {
    expect(checksumAddress("0xb98c32aa56559df22f5b4928e4816d0bb40e0659")).toBe(
      "0xB98C32aa56559df22f5b4928E4816d0bB40e0659"
    );
  });
  it("returns formatted Hex data", () => {
    expect(formatHexDecimals("32770", "Hex")).toBe("0x32770");
  });
  it("returns formatted token price", () => {
    expect(formatPricePretty("1", 1, "12.5315131")).toBe("$1.25");
    expect(formatPricePretty("1", 4, "12.5315131")).toBe("$0.001");
    expect(formatPricePretty("0", 4, "12.5315131")).toBe("$0");
    expect(formatPricePretty("1", 8, "12.5315131")).toBe("<$0.00001");
  });
  it("returns formatted Decimals data", () => {
    expect(formatHexDecimals("0x8002", "Dec")).toBe("32770");
    expect(formatHexDecimals("000000000000000000000000e594ae1d7205e8e92fb22c59d040c31e1fcd139d", "Dec")).toBe(
      "1310674564365545227262193377675158530585864770461"
    );
    expect(formatHexDecimals("000000000000000000000040011002100000000000000000000000e501100197", "Dec")).toBe(
      "93542170771540876828785835717874066337266490409367"
    );
  });
  describe("convert:", () => {
    const token = {
      l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as Address,
      l1Address: null,
      symbol: "ETH",
      name: "ETH",
      decimals: 18,
      usdPrice: 3500,
      liquidity: null,
      iconURL: null,
    };

    it("return correct price", () => {
      expect(convert("0x56bc75e2d63100000", token, token.usdPrice.toString())).toBe("350000.0");
    });
    it("handles float price", () => {
      expect(convert("0x56bc75e2d63100000", token, "0.001")).toBe("0.1");
    });
  });

  describe("numberToHexString", () => {
    it("returns hex str for the specified number", () => {
      expect(numberToHexString(1000)).toBe("0x3e8");
    });

    it("returns hex str for the specified bigint", () => {
      expect(numberToHexString(BigInt("1000000000000000000000000"))).toBe("0xd3c21bcecceda1000000");
    });
  });
});
