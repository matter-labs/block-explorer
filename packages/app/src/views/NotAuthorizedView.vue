<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12"
  >
    <img :src="currentNetwork.logoUrl || '/images/prividium_logo.svg'" alt="Logo" class="mb-6 h-16 w-auto" />

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-xl sm:px-12">
        <LockClosedIcon class="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h1 class="mb-2 text-2xl font-semibold text-gray-900">
          {{ t("notAuthorizedView.notAuthorizedTitle") }}
        </h1>
        <p class="mb-6 text-gray-600">
          {{ t("notAuthorizedView.description") }}
        </p>
        <button
          @click="handleTryAnotherWallet"
          class="w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-800"
        >
          {{ t("notAuthorizedView.tryAnotherWallet") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { LockClosedIcon } from "@heroicons/vue/outline";

import useContext from "@/composables/useContext";

const { t } = useI18n();
const router = useRouter();
const { currentNetwork } = useContext();

const handleTryAnotherWallet = async () => {
  router.push("/login");
};
</script>
