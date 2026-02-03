<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12 sm:px-6 lg:px-8"
  >
    <img :src="currentNetwork.logoUrl || '/images/prividium_logo.svg'" alt="Logo" class="mb-6 h-16 w-auto" />

    <!-- Loading state (no card) -->
    <div v-if="!error" class="text-center">
      <h1 class="mb-4 text-2xl font-semibold text-gray-900">{{ t("authCallbackView.completing") }}</h1>
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
    </div>

    <!-- Error state (with card) -->
    <div v-else class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-xl sm:px-12">
        <h1 class="mb-4 text-2xl font-semibold text-red-600">{{ t("authCallbackView.failed") }}</h1>
        <p class="mb-6 text-gray-600">{{ error }}</p>
        <button
          @click="redirectToLogin"
          class="w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-800"
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
const { currentNetwork } = context;
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
