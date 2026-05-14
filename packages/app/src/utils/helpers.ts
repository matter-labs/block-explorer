import { format } from "date-fns";
import { AbiCoder, Interface } from "ethers";

import { BOOTLOADER_FORMAL_ADDRESS, CONTRACT_DISPLAY_NAMES, DEPLOYER_CONTRACT_ADDRESS } from "./constants";

import type { DecodingType } from "@/components/transactions/infoTable/HashViewer.vue";
import type { AbiFragment } from "@/composables/useAddress";
import type { InputType, TransactionEvent, TransactionLogEntry } from "@/composables/useEventLog";
import type { TokenTransfer } from "@/composables/useTransaction";
import type { InputData } from "@/composables/useTransactionData";
import type { ParamType, Result } from "ethers";

import IInteropCenterABI from "@/abi/IInteropCenter";

export const DefaultAbiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export function utcStringFromUnixTimestamp(timestamp: number) {
  const isoDate = new Date(+`${timestamp}000`).toISOString();
  return format(new Date(isoDate.slice(0, -1)), "yyyy-MM-dd HH:mm:ss a 'UTC'");
}

export function utcStringFromISOString(ISOString: string) {
  return format(new Date(ISOString.slice(0, -1)), "yyyy-MM-dd HH:mm:ss a 'UTC'");
}

export function localDateFromISOString(ISOString: string) {
  return format(new Date(ISOString), "yyyy-MM-dd HH:mm:ss a 'UTC'");
}

export function localDateFromUnixTimestamp(timestamp: number) {
  return format(new Date(timestamp * 1000), "yyyy-MM-dd HH:mm:ss a 'UTC'");
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

export function decodeInputData(input: ParamType, args: Result): InputData[] {
  if (input.isArray()) {
    return decodeArrayInputData(input, args);
  }

  if (input.isTuple()) {
    return decodeTupleInputData(input, args);
  }

  return [
    {
      name: input.name,
      type: input.type as InputType,
      value: args.toString(),
      encodedValue: DefaultAbiCoder.encode([input.type], [args]).split("0x")[1],
      inputs: [],
    },
  ];
}

function decodeArrayInputData(input: ParamType, args: Result): InputData[] {
  const inputs = args.flatMap((arg) => decodeInputData(input.arrayChildren!, arg));

  return [
    {
      name: input.name,
      type: `${inputs[0]?.type ? `${inputs[0]?.type}[]` : input.type}`,
      value: `[${inputs.map((input) => input.value).join(",")}]`,
      inputs: inputs,
      encodedValue: `[${inputs.map((input) => input.encodedValue).join(",")}]`,
    },
  ];
}

function decodeTupleInputData(input: ParamType, args: Result): InputData[] {
  const inputs = input.components!.flatMap((component: ParamType, index: number) =>
    decodeInputData(component, args[index])
  );

  return [
    {
      name: input.name,
      type: `tuple(${inputs.map((input) => input.type).join(",")})`,
      value: `(${inputs.map((input) => input.value).join(",")})`,
      inputs,
      encodedValue: `(${inputs.map((input) => input.encodedValue).join(",")})`,
    },
  ];
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

export function isContractDeployerAddress(address?: string | null): boolean {
  return !address || address === DEPLOYER_CONTRACT_ADDRESS;
}

export function getContractDisplayName(address?: string | null): string | null {
  if (!address) return null;
  return CONTRACT_DISPLAY_NAMES[address.toLowerCase()] ?? null;
}

export const INTEROP_BUNDLE_SENT_TOPIC = new Interface(IInteropCenterABI as never)
  .getEvent("InteropBundleSent")!
  .topicHash.toLowerCase();

function bytesToAddress(bytes: string): string {
  const hex = bytes.startsWith("0x") ? bytes.slice(2) : bytes;
  return `0x${hex.slice(-40).padStart(40, "0")}`;
}

export function decodeInteropBundleSentEvent(log: TransactionLogEntry) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const InteropCenter = new Interface(IInteropCenterABI as any);
    const parsed = InteropCenter.parseLog({ topics: log.topics as string[], data: log.data });
    if (!parsed) return undefined;
    const bundle = parsed.args.interopBundle;
    return {
      sourceChainId: Number(bundle.sourceChainId),
      destinationChainId: Number(bundle.destinationChainId),
      interopBundleHash: parsed.args.interopBundleHash as string,
      l2l1MsgHash: parsed.args.l2l1MsgHash as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      calls: bundle.calls.map((call: any) => ({
        to: call.to as string,
        from: call.from as string,
        value: call.value.toString(),
        data: call.data as string,
        shadowAccount: call.shadowAccount as boolean,
      })),
      bundleAttributes: {
        executionAddress: bytesToAddress(bundle.bundleAttributes.executionAddress as string),
        unbundlerAddress: bytesToAddress(bundle.bundleAttributes.unbundlerAddress as string),
        useFixedFee: bundle.bundleAttributes.useFixedFee as boolean,
      },
    };
  } catch {
    return undefined;
  }
}
