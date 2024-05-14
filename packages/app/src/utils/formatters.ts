import { BigNumber, type BigNumberish, ethers } from "ethers";
import { isHexString } from "ethers/lib/utils";

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
  return ethers.utils.formatUnits(BigNumber.from(value), decimals);
}

export function formatBigNumberish(value: BigNumberish, decimals: number) {
  return ethers.utils.formatUnits(value, decimals).replace(/\.0$/g, "");
}

export function checksumAddress(address: Address | string): Address {
  return ethers.utils.getAddress(address) as Address;
}

export function convert(value: BigNumberish | null, token: Token | null, tokenPrice: string): string {
  if (token && value) {
    return formatValue(
      BigNumber.from(value)
        .mul(BigNumber.from(Math.round(+parseFloat(tokenPrice).toFixed(6) * 1000000)))
        .div(1000000)
        .toString(),
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
    return BigNumber.from(prefix + validValue).toString();
  }
  return BigNumber.from(prefix + validValue).toHexString();
}

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
