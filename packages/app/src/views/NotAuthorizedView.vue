<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#11142B] font-['Inter'] text-white">
    <div class="flex flex-col items-center text-center max-w-md mx-auto px-4">
      <!-- Logo -->
      <div class="mb-10">
        <img src="/images/zksync-light.svg" class="w-[233px] h-[48px]" alt="ZKsync Logo" />
      </div>

      <!-- Heading -->
      <h1 class="text-[30px] leading-[36px] font-bold mb-4">You are not authorized</h1>

      <!-- Sub-heading -->
      <p class="text-lg text-gray-400 mb-10">Contact your administrator to request access</p>

      <!-- Button -->
      <button
        @click="handleTryAnotherWallet"
        class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
      >
        Try another wallet
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();

const handleTryAnotherWallet = async () => {
  router.push("/login");
  console.log("Try another wallet clicked");
};
</script>
