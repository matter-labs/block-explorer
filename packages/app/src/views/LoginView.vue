<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#11142B]">
    <div class="p-8 rounded-lg max-w-xxl w-full flex flex-col items-center">
      <div class="flex justify-center mb-10">
        <img src="/images/zksync-light.svg" class="w-[233px] h-[48px]" />
      </div>
      <h1 class="text-[30px] leading-[36px] font-bold tracking-[0%] mb-2 text-center text-white">
        Private Explorer Access
      </h1>
      <p class="text-white font-normal text-xl leading-8 mb-10 text-center">Sign in with your crypto wallet</p>
      <p class="text-white font-normal text-base leading-7 mb-8 text-center px-0">
        Connect with your authorized wallet to to access data on ZKsync's private chain.
      </p>
      <button
        @click="handleLogin"
        :disabled="isLoginPending"
        class="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLoginPending ? "Connecting..." : "Connect Wallet" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";

const context = useContext();
const { login, isLoginPending, initializeLogin } = useLogin(context);
const router = useRouter();
const route = useRoute();

const handleLogin = async () => {
  try {
    await login();
    if (context.user.value.loggedIn) {
      const redirectPath = route.query.redirect as string;
      router.push(redirectPath || "/");
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};

onMounted(async () => {
  await initializeLogin();
  if (context.user.value.loggedIn) {
    const redirectPath = route.query.redirect as string;
    router.push(redirectPath || "/");
  }
});
</script>
