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
        class="w-[200px] h-[56px] px-8 py-4 text-black bg-white rounded-[28px] hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center mx-auto"
      >
        {{ isLoginPending ? "Connecting..." : "Connect wallet" }}
      </button>
      <p class="text-gray-500 mt-6 text-center text-[14px] leading-[20px] font-normal">
        Only authorized addresses can continue.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import usePrividiumRpc from "@/composables/usePrividiumRpc";

const context = useContext();
const { login, isLoginPending, initializeLogin } = useLogin(context);
const { initializePrividiumRpcUrl } = usePrividiumRpc();
const router = useRouter();
const route = useRoute();

const handleLogin = async () => {
  try {
    await login();
  } catch (error) {
    console.error("Login failed:", error);
  }

  try {
    await initializePrividiumRpcUrl();
  } catch (error) {
    console.error("Login failed:", error);
  }
};

const isValidRedirectPath = (path: unknown): path is string => {
  return typeof path === "string" && path.length > 0;
};

watch(
  () => context.user.value.loggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      const redirectPath = route.query.redirect;
      router.push(isValidRedirectPath(redirectPath) ? redirectPath : { name: "home" });
    }
  }
);

onMounted(async () => {
  await initializeLogin();
});
</script>
