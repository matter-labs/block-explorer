<template>
  <div class="tab-main">
    <ul class="tab-head">
      <template v-for="(tab, i) in tabs">
        <li v-if="tab.hash" :key="`tab-${i}`">
          <button
            v-if="$slots[`tab-${i + 1}-header`]"
            class="tab-btn"
            :class="{ active: currentTabHash === tab.hash && tabs.length > 1 }"
            @click="setTab(tab)"
          >
            <slot :name="`tab-${i + 1}-header`"></slot>
          </button>
          <button
            v-else
            class="tab-btn"
            :class="{ active: currentTabHash === tab.hash && tabs.length > 1 }"
            @click="setTab(tab)"
          >
            <span v-html="tab.title"></span>
            <span v-if="tab.icon" class="tab-icon">
              <component :is="tab.icon" />
            </span>
          </button>
        </li>
      </template>
    </ul>
    <div class="tab-content">
      <div v-for="(tab, i) in tabs" :key="`tab-content-${i}`">
        <div v-show="currentTabHash === tab.hash">
          <slot :name="`tab-${i + 1}-content`"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type PropType, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { FunctionalComponent } from "vue";

export type Tab = {
  title: string;
  hash: string | null;
  icon?: FunctionalComponent | null;
};

const props = defineProps({
  tabs: {
    type: Array as PropType<Tab[]>,
    required: true,
  },
  hasRoute: {
    type: Boolean,
    default: true,
  },
  hasNestedRoute: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();

const calculateCurrrentTabHash = () => {
  let tabHash = route?.hash && props.hasRoute ? route?.hash : props.tabs[0].hash;
  if (route?.hash && route?.hash.split("#").length > 2) {
    // route.hash has multiple hashes (ex: #contracts#read)
    if (props.hasNestedRoute) {
      tabHash = `#${route?.hash.split("#").at(-1)}`;
    } else {
      tabHash = `#${route?.hash.split("#").at(1)}`;
    }
  }
  return tabHash;
};
const currentTabHash = ref(calculateCurrrentTabHash());

const setTab = (tab: Tab) => {
  currentTabHash.value = tab.hash;
  if (props.hasRoute) {
    router.push({ hash: `${tab.hash}` });
  } else if (props.hasNestedRoute) {
    router.push({ hash: `#${route?.hash.split("#")[1]}${tab.hash}` });
  }
};

watchEffect(() => {
  if (props.hasRoute) {
    currentTabHash.value = calculateCurrrentTabHash();
  }
});
</script>
<style lang="scss" scoped>
.tab-main {
  @apply mx-auto w-full rounded-lg bg-white;
  .tab-head {
    @apply flex border-b md:flex-row;
  }
  .tab-btn {
    @apply flex px-4 py-3.5 text-sm text-gray-400 outline-0 sm:text-base;
  }
  .tab-content {
    @apply rounded-b-lg;
  }
  .active {
    @apply border-b-2 border-primary-600 font-bold text-primary-600;
  }
  .tab-icon {
    @apply ml-0.5 w-5 text-green-500;
  }
}
</style>
