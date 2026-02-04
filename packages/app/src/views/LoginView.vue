<template>
  <div
    class="flex min-h-screen flex-col justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12 sm:px-6 lg:px-8"
  >
    <div class="mb-6 text-center sm:mx-auto sm:w-full sm:max-w-md">
      <img :src="currentNetwork.logoUrl || '/images/prividium_logo.svg'" alt="Logo" class="mx-auto mb-4 h-16 w-auto" />
      <h1 class="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
        {{ t("loginView.explorerTitle") }}
      </h1>
      <p class="text-gray-600">{{ t("loginView.subtitle", { brandName }) }}</p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="rounded-2xl border border-gray-200 bg-white px-6 py-10 shadow-xl sm:px-12">
        <h2 class="mb-6 text-center text-2xl font-semibold text-gray-900">
          {{ t("loginView.welcome") }}
        </h2>
        <button
          @click="handleLogin"
          :disabled="isLoginPending"
          class="w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ isLoginPending ? t("loginView.redirecting") : t("loginView.signIn") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

const { t } = useI18n();
const { brandName } = useRuntimeConfig();
const context = useContext();
const { currentNetwork } = context;
const { login, isLoginPending } = useLogin(context);
const router = useRouter();
const route = useRoute();

// Auto-trigger sign-in if ?autosignin=true is present (for cross-app navigation)
onMounted(() => {
  if (route.query.autosignin === "true") {
    handleLogin();
  }
});

const handleLogin = async () => {
  try {
    await login();
  } catch (error: unknown) {
    if (error instanceof FetchError && error.response?.status === 403) {
      router.push({ name: "not-authorized" });
      return;
    }
    console.error("Login failed:", error);
  }
};

const isValidRedirectPath = (path: unknown): path is string => {
  return typeof path === "string" && path.length > 0;
};

watchEffect(() => {
  if (context.user.value.loggedIn) {
    const redirectPath = route.query.redirect;
    router.push(isValidRedirectPath(redirectPath) ? redirectPath : "/");
  }
});
</script>
