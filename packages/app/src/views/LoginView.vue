<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
      <img src="/images/prividium_logo.svg" alt="Prividium Logo" class="h-16 w-auto mx-auto mb-4" />
      <h1
        class="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2"
      >
        {{ t("loginView.explorerTitle") }}
      </h1>
      <p class="text-gray-600">{{ t("loginView.subtitle") }}</p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-10 px-6 shadow-xl rounded-2xl sm:px-12 border border-gray-200">
        <button
          @click="handleLogin"
          :disabled="isLoginPending"
          class="w-full py-3 px-4 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {{ isLoginPending ? t("loginView.redirecting") : t("loginView.signIn") }}
        </button>
        <p class="mt-6 text-center text-sm text-gray-500">
          {{ t("loginView.onlyAuthorizedAdvice") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";

const { t } = useI18n();
const context = useContext();
const { login, isLoginPending } = useLogin(context);
const router = useRouter();
const route = useRoute();

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
