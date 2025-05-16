<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#11142B] text-white">
    <div class="flex flex-col items-center text-center">
      <!-- Logo -->
      <div class="mb-10">
        <img src="/images/zksync-light.svg" class="w-[233px] h-[48px]" alt="ZKsync Logo" />
      </div>

      <!-- Heading -->
      <h1 class="text-[30px] leading-[36px] font-bold mb-12">Private Explorer Access</h1>

      <!-- Loading Spinner and Text -->
      <div class="flex items-center mb-10">
        <svg
          class="animate-spin h-6 w-6 text-white mr-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-lg">Reviewing permissions...</span>
      </div>

      <!-- Disconnect Message -->
      <p class="text-sm text-gray-400">
        If the system is not responding, you can
        <button @click="handleDisconnect" class="underline hover:text-gray-200 focus:outline-none">disconnect</button>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const handleDisconnect = async () => {
  router.push("/login"); // Redirect to login or a specific page after disconnect
  console.log("Disconnect clicked");
};

// Simulate permission review and redirect after 3 seconds for testing
onMounted(() => {
  setTimeout(() => {
    router.push("/"); // Navigate to home page
  }, 3000); // 3 seconds delay
});
</script>

<style scoped>
/* Scoped styles if needed, though Tailwind is used primarily */
</style>
