<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#11142B] text-white">
    <div class="flex flex-col items-center text-center max-w-md mx-auto px-4">
      <!-- Logo -->
      <div class="mb-10">
        <img src="/images/zksync-light.svg" class="w-[233px] h-[48px]" alt="ZKsync Logo" />
      </div>

      <!-- Heading -->
      <h1 class="text-[30px] leading-[36px] font-bold mb-2">
        {{ t("notAuthorizedView.notAuthorizedTitle") }}
      </h1>

      <!-- Sub-heading -->
      <p class="font-normal text-xl leading-8 mb-10">
        {{ t("notAuthorizedView.description") }}
      </p>

      <!-- Button -->
      <button
        @click="handleTryAnotherWallet"
        class="w-[200px] h-[56px] px-8 py-4 text-black bg-white rounded-[28px] hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center mx-auto"
      >
        {{ t("notAuthorizedView.tryAnotherWallet") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const handleTryAnotherWallet = async () => {
  router.push("/login");
};
</script>
