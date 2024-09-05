<template>
  <a
    v-if="network === 'L1' && !!currentNetwork.l1ExplorerUrl"
    target="_blank"
    :href="`${currentNetwork.l1ExplorerUrl}/address/${formattedAddress}`"
  >
    <slot>
      {{ formattedAddress }}
    </slot>
  </a>
  <span v-else-if="network === 'L1' && !currentNetwork.l1ExplorerUrl">
    <slot>
      {{ formattedAddress }}
    </slot>
  </span>
  <router-link v-else :to="{ name: 'address', params: { address: formattedAddress } }">
    <slot>
      <span
        v-if="vanityAddress !== null"
        style="font-weight: bold; background-color: greenyellow; font-size: 20px; padding: 5px"
      >
        {{ vanityAddress }}
      </span>
      {{ formattedAddress }}
    </slot>
  </router-link>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";

import useContext from "@/composables/useContext";

import type { Address } from "@/types";
import type { NetworkOrigin } from "@/types";

import { checksumAddress } from "@/utils/formatters";

const props = defineProps({
  address: {
    type: String as PropType<Address>,
    default: "",
    required: true,
  },
  network: {
    type: String as PropType<NetworkOrigin>,
    default: "L2",
  },
});

const { currentNetwork } = useContext();
const formattedAddress = computed(() => checksumAddress(props.address));

function hexToAscii(hex: string): string {
  let asciiStr = "";

  // Make sure hex length is even
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  for (let i = 0; i < hex.length; i += 2) {
    // Convert each pair of hex digits to an ASCII character
    const hexByte = hex.slice(i, i + 2);
    const charCode = parseInt(hexByte, 16);
    asciiStr += String.fromCharCode(charCode);
  }

  return asciiStr;
}
function parseEthereumAddress(address: string): string | null {
  // Check if the address starts with "0x"
  if (!address.startsWith("0x")) {
    throw new Error("Invalid Ethereum address format. Address should start with '0x'.");
  }

  // Remove the "0x" prefix
  const cleanAddress = address.slice(2);

  // Check if the first 20 characters (10 bytes) are all zeroes
  const zeroBytes = "00000000000000000000"; // 20 characters of zero

  if (cleanAddress.startsWith(zeroBytes)) {
    // Extract the rest of the address after the 10 zero bytes
    let restOfAddress = cleanAddress.slice(20);
    // Remove leading "00" hex values from the rest of the address
    restOfAddress = restOfAddress.replace(/^0+/, "");
    restOfAddress = restOfAddress.toLowerCase();

    // Convert the remaining part of the address from hex to ASCII
    try {
      const asciiString = hexToAscii(restOfAddress);
      // System contract
      if (asciiString.length < 3) {
        return null;
      }
      return asciiString;
    } catch (error) {
      console.error("Failed to parse the remaining address as hex ASCII.");
      return null;
    }
  }

  return null; // If the address doesn't start with 10 bytes of zeroes
}

const vanityAddress = computed(() => parseEthereumAddress(props.address));
</script>
