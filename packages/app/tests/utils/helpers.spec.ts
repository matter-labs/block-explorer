import { describe, expect, it } from "vitest";

import { format } from "date-fns";
import { utils } from "zksync-ethers";

import ExecuteTx from "@/../mock/transactions/Execute.json";

import type { InputType } from "@/composables/useEventLog";
import type { TokenTransfer } from "@/composables/useTransaction";

import {
  arrayHalfDivider,
  camelCaseFromSnakeCase,
  contractInputTypeToHumanType,
  getRawFunctionType,
  getRequiredArrayLength,
  getTypeFromEvent,
  isArrayFunctionType,
  ISOStringFromUnixTimestamp,
  localDateFromISOString,
  localDateFromUnixTimestamp,
  mapOrder,
  sortTokenTransfers,
  truncateNumber,
  utcStringFromISOString,
  utcStringFromUnixTimestamp,
} from "@/utils/helpers";

const { BOOTLOADER_FORMAL_ADDRESS, ETH_ADDRESS } = utils;
const event = {
  name: "Deposit",
  inputs: [
    {
      name: "user",
      type: "address" as InputType,
      value: "0x1C788067e4356813c597bD4195094D799398d098",
    },
    {
      name: "lpToken",
      type: "address" as InputType,
      value: "0xBDFBFb8E074a8896295040864cD019a9BdF6405E",
    },
    {
      name: "amount",
      type: "uint256" as InputType,
      value: "7390389221611163482",
    },
  ],
};

describe("helpers:", () => {
  it("returns utc string from unix timestamp", () => {
    expect(utcStringFromUnixTimestamp(1645606700)).toBe("2022-02-23 08:58 UTC");
  });

  it("returns utc string from ISO string", () => {
    expect(utcStringFromISOString("2022-04-08T18:21:14.362648Z")).toBe("2022-04-08 18:21:14 UTC");
  });

  it("returns ISO string from unix timestamp", () => {
    expect(ISOStringFromUnixTimestamp(1645606700)).toBe("2022-02-23T08:58:20.000Z");
  });

  it("returns camelCase string from snake_case string", () => {
    expect(camelCaseFromSnakeCase("test_string")).toBe("testString");
  });

  it("returns local date from ISO string", () => {
    const result = format(new Date("2022-04-08T18:21:14.362648Z"), "yyyy-MM-dd HH:mm");
    expect(localDateFromISOString("2022-04-08T18:21:14.362648Z")).toBe(result);
  });

  it("returns local date from unix timestamp", () => {
    const result = format(new Date(1645606700 * 1000), "yyyy-MM-dd HH:mm");
    expect(localDateFromUnixTimestamp(1645606700)).toBe(result);
  });

  it("returns sorted array", () => {
    const order = ["1", "2", "3", "4", "5"];
    const source = [
      { id: "2", label: "Two" },
      { id: "3", label: "Three" },
      { id: "5", label: "Five" },
      { id: "4", label: "Four" },
      { id: "1", label: "One" },
      { id: "6", label: "Six" },
    ];
    const result = mapOrder(source, order, `id`);
    expect(result).toEqual([
      { id: "1", label: "One" },
      { id: "2", label: "Two" },
      { id: "3", label: "Three" },
      { id: "4", label: "Four" },
      { id: "5", label: "Five" },
      { id: "6", label: "Six" },
    ]);
  });

  it("returns an array split into two arrays in half", () => {
    expect(arrayHalfDivider([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9],
    ]);
  });
  describe("contractInputTypeToHumanType:", () => {
    it("returns text type", () => {
      expect(contractInputTypeToHumanType("string")).toBe("text");
    });
    it("returns address type", () => {
      expect(contractInputTypeToHumanType("address")).toBe("address");
    });
    it("returns number type", () => {
      expect(contractInputTypeToHumanType("uint8")).toBe("number");
      expect(contractInputTypeToHumanType("uint256")).toBe("number");
    });
    it("returns undefined for other cases", () => {
      expect(contractInputTypeToHumanType("" as InputType)).toBe(undefined);
    });
  });
  it("returns event type", () => {
    expect(getTypeFromEvent(event, 1)).toBe("address");
    expect(getTypeFromEvent(event, 2)).toBe("address");
    expect(getTypeFromEvent(event, 3)).toBe("number");
  });
  describe("isArrayFunctionType:", () => {
    it("returns true for array type", () => {
      expect(isArrayFunctionType("uint256[]")).toBe(true);
    });
    it("returns false for non-array type", () => {
      expect(isArrayFunctionType("uint256")).toBe(false);
    });
  });
  describe("getRawFunctionType:", () => {
    it("returns raw function type", () => {
      expect(getRawFunctionType("uint256[]")).toBe("uint256");
    });
    it("returns raw function type", () => {
      expect(getRawFunctionType("uint256")).toBe("uint256");
    });
  });
  describe("getRequiredArrayLength:", () => {
    it("returns required array length", () => {
      expect(getRequiredArrayLength("uint256[1]")).toBe(1);
    });
    it("return undefined for unassigned arrays", () => {
      expect(getRequiredArrayLength("uint256[]")).toBe(undefined);
    });
    it("return undefined for non-array type", () => {
      expect(getRequiredArrayLength("uint256")).toBe(undefined);
    });
  });
  describe("sortTokenTransfers:", () => {
    it("prioritizes actual token transfers through sorting", () => {
      const transfers = [
        { ...ExecuteTx.transfers[0], from: BOOTLOADER_FORMAL_ADDRESS, to: ETH_ADDRESS },
        { ...ExecuteTx.transfers[0], from: ETH_ADDRESS, to: BOOTLOADER_FORMAL_ADDRESS },
        { ...ExecuteTx.transfers[0] },
      ] as TokenTransfer[];

      expect(sortTokenTransfers(transfers)).toEqual([
        { ...ExecuteTx.transfers[0] },
        { ...ExecuteTx.transfers[0], from: ETH_ADDRESS, to: BOOTLOADER_FORMAL_ADDRESS },
        { ...ExecuteTx.transfers[0], from: BOOTLOADER_FORMAL_ADDRESS, to: ETH_ADDRESS },
      ]);
    });
  });
  describe("truncateNumber:", () => {
    it("truncates the number to the given decimal", () => {
      expect(truncateNumber("211.5197493", 2)).toEqual("211.51");
    });
    it("doesn't trancate the number if number is not integer", () => {
      expect(truncateNumber("2115197493", 2)).toEqual("2115197493");
    });
    it("returns the value if decimal is 0", () => {
      expect(truncateNumber("211.5197493", 0)).toEqual("211.5197493");
    });
    it("returns the value if the decimals of the number are less than the given decimal attribute", () => {
      expect(truncateNumber("0.02", 5)).toEqual("0.02");
    });
  });
});
