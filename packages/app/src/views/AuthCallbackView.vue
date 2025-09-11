<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#11142B]">
    <div class="p-8 rounded-lg max-w-xl w-full flex flex-col items-center">
      <div class="flex justify-center mb-10">
        <img src="/images/zksync-light.svg" class="w-[233px] h-[48px]" />
      </div>
      <div v-if="!error" class="text-center">
        <h1 class="text-[30px] leading-[36px] font-bold tracking-[0%] mb-4 text-white">Completing authentication...</h1>
        <div class="flex justify-center">
          <svg
            class="animate-spin h-8 w-8 text-white"
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
        </div>
      </div>
      <div v-else class="text-center">
        <h1 class="text-[30px] leading-[36px] font-bold tracking-[0%] mb-4 text-red-500">Authentication failed</h1>
        <p class="text-white mb-6">{{ error }}</p>
        <button
          @click="redirectToLogin"
          class="w-[200px] h-[56px] px-8 py-4 text-black bg-white rounded-[28px] hover:bg-gray-200 font-semibold text-base"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";

const router = useRouter();
const route = useRoute();
const context = useContext();
const { handlePrividiumCallback } = useLogin(context);

const error = ref<string | null>(null);

const isValidRedirectPath = (path: unknown): path is string => {
  return typeof path === "string" && path.length > 0;
};

const redirectToLogin = () => {
  const redirectPath = route.query.redirect;
  router.push({
    name: "login",
    query: isValidRedirectPath(redirectPath) ? { redirect: redirectPath } : undefined,
  });
};

onMounted(async () => {
  try {
    await handlePrividiumCallback();
    const redirectPath = route.query.redirect;
    await router.push(isValidRedirectPath(redirectPath) ? redirectPath : "/");
  } catch (err: unknown) {
    console.error("Auth callback failed:", err);

    if (err instanceof FetchError && err.response?.status === 403) {
      router.push("/not-authorized");
    } else if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = "An unexpected error occurred";
    }
  }
});
</script>
