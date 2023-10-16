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
</script>
