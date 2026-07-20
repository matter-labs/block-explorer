import type { AbiFragment } from "@/composables/useAddress";
import type { TransactionLogEntry } from "@/composables/useEventLog";
import type { HexDecimals, TraceStep } from "@/composables/useTrace";

import { checksumAddress, formatHexDecimals } from "@/utils/formatters";
import { decodeLogWithABI } from "@/utils/helpers";

export function mapContractEvents(contractEvents: TransactionLogEntry[], abi?: AbiFragment[]): TransactionLogEntry[] {
  return contractEvents.map((e) => ({
    ...e,
    blockNumber: BigInt(e.blockNumber),
    event: abi ? decodeLogWithABI(e, abi) : undefined,
    address: checksumAddress(e.address),
  }));
}

export function mapStep(step: TraceStep, dataFormat: HexDecimals) {
  return {
    ...step,
    memory_interactions: [
      ...step.memory_interactions.map((e) => ({
        ...e,
        address: formatHexDecimals(e.address.toString(), dataFormat),
        value: formatHexDecimals(e.value, dataFormat),
      })),
    ],
    memory_snapshots: [
      ...step.memory_snapshots.map((e) => ({
        ...e,
        values: [...e.values.map((value) => formatHexDecimals(value, dataFormat))],
      })),
    ],
    registers: [...step.registers.map((value) => formatHexDecimals(value, dataFormat))],
  };
}
