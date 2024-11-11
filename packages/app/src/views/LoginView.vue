<template>
  <div class="home">
    <h1 class="title">{{ t("login.title") }}</h1>
    <div class="subtitle">{{ t("login.subtitle") }}</div>
  </div>

  <div class="flex justify-center flex-1">
    <div class="flex flex-1 flex-col items-center max-w-xl">
      <div class="w-full rounded-lg shadow-md mt-8 bg-white flex-1 p-4 space-y-4">
        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="flex items-center space-x-4 p-4 rounded-lg transition-colors border border-gray-400"
          :class="{
            'bg-gray-100 border-green-400': step.completed,
            'bg-gray-200': step.isActive,
            'opacity-50': !step.isActive && !step.completed,
          }"
        >
          <component v-if="!step.completed" :is="step.icon" class="h-8 w-8 text-gray-500" />
          <component v-else :is="CheckCircleIcon" class="h-8 w-8 text-green-500" />
          <div class="flex-1 space-y-1">
            <p class="font-bold leading-none" :class="{ 'text-green-500': step.completed }">{{ step.title }}</p>
            <p class="text-sm text-gray-500">{{ step.subtitle }}</p>
          </div>
          <button
            v-if="step.isActive && !step.completed"
            class="rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-24"
            :disabled="step.completed || step.pending"
            @click="step.action"
          >
            <LoadingIcon v-if="step.pending" class="h-4 w-4" />
            <span v-else>{{ step.completed ? "Completed" : "Continue" }}</span>
          </button>
        </div>
        <div class="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-400" :class="{ 'opacity-50': !rpcToken }">
          <p class="font-bold mb-2">RPC Token:</p>
          <p class="font-mono break-all bg-white p-2 rounded text-sm">{{ rpcToken || "Not available" }}</p>
          <p class="font-bold mb-2 mt-4">RPC URL:</p>
          <p class="font-mono break-all bg-white p-2 rounded text-sm">{{ rpcUrl || "Not available" }}</p>
          <button
            class="mt-4 w-full rounded-md bg-gray-800 text-white px-4 py-2 hover:bg-gray-700 transition-colors flex items-center justify-center h-10 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
            @click="addNetworkToMetamask"
            :disabled="!rpcToken"
          >
            <LoadingIcon v-if="isAddNetworkPending" class="h-4 w-4 mx-auto" />
            <span v-else class="flex items-center space-x-2 justify-center">
              <img src="/images/metamask.svg" class="mr-2 h-6 w-6" />
              {{ t("login.addNetworkToMetamask") }}
            </span>
          </button>
        </div>
      </div>

      <div class="mt-8 w-full" v-if="allStepsCompleted">
        <button
          class="rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors h-10 flex items-center justify-center w-32 mx-auto"
          @click="logout"
        >
          <LogoutIcon class="h-4 w-4 mr-2" />
          {{ t("login.logout") }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import WalletIcon from "@/components/icons/WalletIcon.vue";
import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import useRpcToken, { rpcToken, rpcUrl } from "@/composables/useRpcToken";
import useWallet from "@/composables/useWallet";
import { KeyIcon, LockClosedIcon, LogoutIcon } from "@heroicons/vue/outline";
import { CheckCircleIcon } from "@heroicons/vue/solid";

const { t } = useI18n();
const context = useContext();

const { address, isConnectPending, isAddNetworkPending, connect, addNetwork, disconnect } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});
const {
  login,
  isLoginPending,
  logout: loginLogout,
} = useLogin({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});
const { updateRpcToken } = useRpcToken(context);

const steps = ref([
  {
    icon: WalletIcon,
    title: "Connect Wallet",
    subtitle: "Connect your Metamask Wallet",
    action: async () => {
      await connect();
      steps.value[1].isActive = true;
    },
    completed: computed(() => !!address.value),
    pending: computed(() => isConnectPending.value),
    isActive: false,
  },
  {
    icon: KeyIcon,
    title: "Sign In",
    subtitle: "Sign in with Ethereum",
    action: async () => {
      await login();
      steps.value[2].isActive = true;
    },
    completed: computed(() => !!context.user.value?.loggedIn),
    pending: computed(() => isLoginPending.value),
    isActive: false,
  },
  {
    icon: LockClosedIcon,
    title: "Connect to Private Network",
    subtitle: "Generate token for private network and connect",
    action: async () => {
      await connectToPrivateNetwork();
    },
    completed: computed(() => !!rpcToken.value),
    pending: ref(false),
    isActive: false,
  },
]);

watchEffect(() => {
  steps.value.forEach((step) => (step.isActive = false));

  const firstIncompleteStep = steps.value.find((step) => !step.completed);
  if (firstIncompleteStep) {
    firstIncompleteStep.isActive = true;
  }
});

async function connectToPrivateNetwork() {
  return updateRpcToken();
}

async function addNetworkToMetamask() {
  if (!rpcUrl.value) {
    return;
  }
  await addNetwork(rpcUrl.value);
}

const allStepsCompleted = computed(() => steps.value.every((step) => step.completed));

async function logout() {
  disconnect();
  rpcToken.value = null;
  await loginLogout();
}
</script>

<style lang="scss" scoped>
.home {
  @apply mt-4;

  .title {
    @apply text-4xl font-bold text-white;
  }
  .subtitle {
    @apply mt-2 text-base text-white sm:text-2xl;
  }
}
.button-spinner {
  @apply m-0;
}
</style>
