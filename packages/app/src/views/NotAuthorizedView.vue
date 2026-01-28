<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col items-center justify-center py-12 px-4"
  >
    <img src="/images/prividium_logo.svg" alt="Prividium Logo" class="h-16 w-auto mb-6" />

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-10 px-6 shadow-xl rounded-2xl sm:px-12 border border-gray-200 text-center">
        <LockClosedIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h1 class="text-2xl font-semibold text-gray-900 mb-2">
          {{ t("notAuthorizedView.notAuthorizedTitle") }}
        </h1>
        <p class="text-gray-600 mb-6">
          {{ t("notAuthorizedView.description") }}
        </p>
        <button
          @click="handleTryAnotherWallet"
          class="w-full py-3 px-4 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-medium transition-colors"
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

const { t } = useI18n();
const router = useRouter();

const handleTryAnotherWallet = async () => {
  router.push("/login");
};
</script>
