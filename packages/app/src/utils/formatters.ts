import { type BigNumberish, formatUnits, getAddress, isHexString } from "ethers";

import type { Token } from "@/composables/useToken";
import type { HexDecimals } from "@/composables/useTrace";
import type { Address } from "@/types";

export function formatMoney(num: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    notation: num > 99_999_999 ? "compact" : "standard",
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(num);
}

export function formatPrice(num: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatWithSpaces(num: number) {
  return new Intl.NumberFormat("fr-FR").format(num);
}

export function stringFromAsciiArray(asciiArray: number[]) {
  return asciiArray.reduce((acc, currentValue) => acc + String.fromCharCode(currentValue), "");
}

export function shortValue(value: string, count = 13): string {
  return !value
    ? ""
    : value.length < count
    ? value
    : value.substring(0, count / 2) + "..." + value.substring(value.length - 4, value.length);
}

export function formatValue(value: BigNumberish, decimals: number): string {
  return formatUnits(BigInt(value), decimals);
}

export function formatBigNumberish(value: BigNumberish, decimals: number) {
  return formatUnits(value, decimals).replace(/.0$/g, "");
}

export function checksumAddress(address: Address | string): Address {
  return getAddress(address) as Address;
}

export function convert(value: BigNumberish | null, token: Token | null, tokenPrice: string): string {
  if (token && value) {
    return formatValue(
      ((BigInt(value) * BigInt(Math.round(+parseFloat(tokenPrice).toFixed(6) * 1000000))) / BigInt(1000000)).toString(),
      token.decimals
    );
  } else {
    return "";
  }
}

export function formatHexDecimals(value: string, showValueAs: HexDecimals) {
  const validValue = value === "0x" ? "0" : value;
  const prefix = isHexString(validValue) ? "" : "0x";
  if (showValueAs === "Dec") {
    return BigInt(prefix + validValue).toString();
  }
  return `0x${BigInt(prefix + validValue).toString(16)}`;
}
export const numberToHexString = (num: number | bigint) => `0x${num.toString(16)}`;

export function formatPricePretty(amount: BigNumberish, decimals: number, usdPrice: string) {
  const price = +usdPrice * +formatBigNumberish(amount, decimals);
  const leadingZeroes = price.toString().split(".")[1]?.match(/^0*/)?.[0].length || 0;
  const priceDecimals = Math.max(2, Math.min(5, leadingZeroes + 1));
  if (price === 0) {
    return "$0";
  } else if (price < 0.00001) {
    return `<${formatMoney(0.00001, 5)}`;
  } else {
    return `${formatMoney(price, priceDecimals)}`;
  }
}
