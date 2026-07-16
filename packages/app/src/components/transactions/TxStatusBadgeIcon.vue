<template>
  <img class="status-badge-icon" :src="resolveAsset(currentNetwork.txStatusBadgeIconUrl ?? '')" alt="" />
</template>

<script lang="ts" setup>
import useContext from "@/composables/useContext";

import { resolveAsset } from "@/utils/appBase";

const { currentNetwork } = useContext();
</script>

<style lang="scss" scoped>
.status-badge-icon {
  @apply my-0.5 ml-2 mr-0 h-4 w-4 object-contain;
}
</style>
