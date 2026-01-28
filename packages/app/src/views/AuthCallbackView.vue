<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col items-center justify-center py-12 px-4"
  >
    <img src="/images/prividium_logo.svg" alt="Prividium Logo" class="h-16 w-auto mb-6" />

    <!-- Loading state (no card) -->
    <div v-if="!error" class="text-center">
      <h1 class="text-2xl font-semibold text-gray-900 mb-4">{{ t("authCallbackView.completing") }}</h1>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
    </div>

    <!-- Error state (with card) -->
    <div v-else class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-10 px-6 shadow-xl rounded-2xl sm:px-12 border border-gray-200 text-center">
        <h1 class="text-2xl font-semibold text-red-600 mb-4">{{ t("authCallbackView.failed") }}</h1>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <button
          @click="redirectToLogin"
          class="w-full py-3 px-4 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-medium transition-colors"
        >
          {{ t("authCallbackView.tryAgain") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";

const { t } = useI18n();

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
