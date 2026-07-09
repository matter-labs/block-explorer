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
  @apply ml-1 h-5 w-5 object-contain;
}
</style>
