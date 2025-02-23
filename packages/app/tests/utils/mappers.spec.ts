import { describe, expect, it } from "vitest";

import type { TransactionLogEntry } from "@/composables/useEventLog";
import type { TraceStep } from "@/composables/useTrace";
import type { Address } from "@/types";

import { checksumAddress, formatHexDecimals } from "@/utils/formatters";
import { mapContractEvents, mapStep } from "@/utils/mappers";

describe("mappers:", () => {
  it("correctly formats contractEvents", () => {
    const contractEvents = [
      {
        address: "0x4d82c246feae3f67303d2500ac9fb18fc654d151" as Address,
        topics: [
          "0x5548c837ab068cf56a2c2479df0882a4922fd203edb7517321831d95078c5f62",
          "0x000000000000000000000000e4c86a18d06f687ca8f83f6c7123066941a48b9d",
          "0x000000000000000000000000bd18fed8ff534c3f6f169dfe7f2d462f05590f34",
        ],
        data: "0x00000000000000000000000000000000000000000000000000000033ef3c4feb",
        blockHash: "0xd2a12062d1ebb1dedad2fd378ba91c90c59a061a1938657e3ab6c508130d0124",
        blockNumber: "0x2e3099",
        l1BatchNumber: "0x92bab",
        transactionHash: "0x34c62716d99068c6a7742cc74fe9c0020d7a600a67ea2d8a216ab93182995a90",
        transactionIndex: "0x0",
        logIndex: "0x4",
        transactionLogIndex: "0x4",
        logType: null,
        removed: false,
      },
    ];

    const result = mapContractEvents(contractEvents as TransactionLogEntry[]);
    expect(result).toEqual([
      {
        ...contractEvents[0],
        blockNumber: BigInt(contractEvents[0].blockNumber),
        address: checksumAddress(contractEvents[0].address),
      },
    ]);
  });
  it("correctly formats step data", () => {
    const step = {
      contract_address: "0xe594ae1d7205e8e92fb22c59d040c31e1fcd139d",
      registers: [
        "0x24000000000000000300000000",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
        "0x0",
      ],
      pc: 0,
      sp: 0,
      set_flags: [],
      skip_cycle: false,
      code_page_index: 4,
      heap_page_index: 6,
      stack_page_index: 5,
      register_interactions: {},
      memory_interactions: [
        {
          memory_type: "code",
          page: 4,
          address: 0,
          value: "0000000000000002000000000000000200000000000000010000000000010355",
          direction: "Read",
        },
      ],
      memory_snapshots: [
        {
          memory_type: "calldata",
          page: 3,
          length: 2,
          values: [
            "0x7b3ff5e1000000000000000000000000000000000000000000000000ffffffff",
            "0xffffffff00000000000000000000000000000000000000000000000000000000",
          ],
        },
      ],
      returndata_page_index: 0,
      calldata_page_index: 0,
      error: null,
    };

    const dataFormatHex = "Hex";

    const resultHex = mapStep(step as TraceStep, dataFormatHex);
    expect(resultHex).toEqual({
      ...step,
      memory_interactions: [
        ...step.memory_interactions.map((e) => ({
          ...e,
          address: formatHexDecimals(e.address.toString(), dataFormatHex),
          value: formatHexDecimals(e.value, dataFormatHex),
        })),
      ],
      memory_snapshots: [
        ...step.memory_snapshots.map((e) => ({
          ...e,
          values: [...e.values.map((value) => formatHexDecimals(value, dataFormatHex))],
        })),
      ],
      registers: [...step.registers.map((value) => formatHexDecimals(value, dataFormatHex))],
    });

    const dataFormatDecimals = "Dec";

    const resultDecimals = mapStep(step as TraceStep, dataFormatDecimals);
    expect(resultDecimals).toEqual({
      ...step,
      memory_interactions: [
        ...step.memory_interactions.map((e) => ({
          ...e,
          address: formatHexDecimals(e.address.toString(), dataFormatDecimals),
          value: formatHexDecimals(e.value, dataFormatDecimals),
        })),
      ],
      memory_snapshots: [
        ...step.memory_snapshots.map((e) => ({
          ...e,
          values: [...e.values.map((value) => formatHexDecimals(value, dataFormatDecimals))],
        })),
      ],
      registers: [...step.registers.map((value) => formatHexDecimals(value, dataFormatDecimals))],
    });
  });
});
