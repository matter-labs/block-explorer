<template>
  <a
    v-if="network === 'L1' && !!currentNetwork.l1ExplorerUrl"
    target="_blank"
    :href="`${currentNetwork.l1ExplorerUrl}/${props.isTokenAddress ? `token` : `address`}/${formattedAddress}`"
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
  <router-link v-else :to="{ name: props.isTokenAddress ? `token` : `address`, params: { address: formattedAddress } }">
    <slot v-if="!snsName">
      {{ formattedAddress }}
    </slot>
    <span v-else>
      {{ snsName }}
    </span>
  </router-link>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref, watch } from "vue";

import useContext from "@/composables/useContext";
import useSns from "@/composables/useSns";

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
  isTokenAddress: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const { currentNetwork } = useContext();
const formattedAddress = computed(() => checksumAddress(props.address));
const { fetchSNSName } = useSns();
const snsName = ref<string | null>(null);
watch(
  () => formattedAddress.value,
  async (newAddress) => {
    if (newAddress) {
      const name = await fetchSNSName(newAddress, true);
      if (name) {
        snsName.value = name;
      }
    }
  },
  { immediate: true }
);
</script>
