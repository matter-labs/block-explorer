import { format } from "date-fns";
import { Interface } from "ethers";
import { utils } from "zksync-ethers";

import type { DecodingType } from "@/components/transactions/infoTable/HashViewer.vue";
import type { AbiFragment } from "@/composables/useAddress";
import type { InputType, TransactionEvent, TransactionLogEntry } from "@/composables/useEventLog";
import type { TokenTransfer } from "@/composables/useTransaction";

const { BOOTLOADER_FORMAL_ADDRESS } = utils;

export function utcStringFromUnixTimestamp(timestamp: number) {
  const isoDate = new Date(+`${timestamp}000`).toISOString();
  return format(new Date(isoDate.slice(0, -1)), "yyyy-MM-dd HH:mm 'UTC'");
}

export function utcStringFromISOString(ISOString: string) {
  return format(new Date(ISOString.slice(0, -1)), "yyyy-MM-dd HH:mm:ss 'UTC'");
}

export function localDateFromISOString(ISOString: string) {
  return format(new Date(ISOString), "yyyy-MM-dd HH:mm");
}

export function localDateFromUnixTimestamp(timestamp: number) {
  return format(new Date(timestamp * 1000), "yyyy-MM-dd HH:mm");
}

export function ISOStringFromUnixTimestamp(timestamp: number) {
  return new Date(+`${timestamp}000`).toISOString();
}

export function camelCaseFromSnakeCase(str: string) {
  return str.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayHalfDivider(arr: any[]) {
  const newArray = [...arr];
  const middleIndex = Math.ceil(newArray.length / 2);
  return [newArray.splice(0, middleIndex), newArray];
}

export function contractInputTypeToHumanType(type: InputType): DecodingType | undefined {
  switch (type) {
    case "string":
      return "text";
    case "address":
      return "address";
    case "uint8":
    case "uint256":
      return "number";

    default:
      return undefined;
  }
}

export function getTypeFromEvent(event: TransactionEvent, index: number) {
  const inputIndex = index - 1;
  if (!event || !event.inputs[inputIndex]) {
    return undefined;
  }
  return contractInputTypeToHumanType(event.inputs[inputIndex].type);
}

export function isArrayFunctionType(type: string) {
  return !!type.match(/(.*)\[(.*)\]/);
}
export function getRawFunctionType(type: string) {
  const arrayMatch = type.match(/(.*)\[(.*)\]/);
  return arrayMatch ? arrayMatch[1] : type;
}
export function getRequiredArrayLength(type: string) {
  const value = parseInt(type.match(/(.*)\[(.*)\]/)?.[2] ?? "");
  return isNaN(value) ? undefined : value;
}

/* This is a hack needed to mock the location in tests */
export const getWindowLocation = () => window.location;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapOrder = (array: any[], order: string[], key: string) => {
  return array.sort((a, b) => {
    let indA = order.indexOf(a[key]);
    let indB = order.indexOf(b[key]);
    if (indA == -1) {
      indA = order.length;
    }
    if (indB == -1) {
      indB = order.length;
    }
    return indA - indB;
  });
};

export function decodeLogWithABI(log: TransactionLogEntry, abi: AbiFragment[]): TransactionEvent | undefined {
  const contractInterface = new Interface(abi);
  try {
    const decodedLog = contractInterface.parseLog({
      topics: log.topics,
      data: log.data,
    })!;
    return {
      name: decodedLog.name,
      inputs: decodedLog?.fragment.inputs.map((input) => ({
        name: input.name,
        type: input.type as InputType,
        value: decodedLog.args[input.name]?.toString(),
      })),
    };
  } catch {
    return undefined;
  }
}

export function sortTokenTransfers(transfers: TokenTransfer[]): TokenTransfer[] {
  return [...transfers].sort((_, t) => {
    if (t.to === BOOTLOADER_FORMAL_ADDRESS || t.from === BOOTLOADER_FORMAL_ADDRESS) {
      return -1;
    }
    return 0;
  });
}

export function truncateNumber(value: string, decimal: number): string {
  if (!decimal) {
    return value;
  }
  const regex = new RegExp(`\\d+(?:\\.\\d{0,${decimal}})?`);
  return value.match(regex)![0];
}
