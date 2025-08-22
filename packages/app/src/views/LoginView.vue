<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#11142B]">
    <div class="max-w-xxl flex w-full flex-col items-center rounded-lg p-8">
      <div class="mb-10 flex justify-center">
        <img src="/images/zksync-light.svg" class="h-[48px] w-[233px]" />
      </div>
      <h1 class="mb-10 text-center text-[30px] font-bold leading-[36px] tracking-[0%] text-white">
        {{ t("loginView.explorerTitle") }}
      </h1>
      <div class="flex flex-col items-center gap-4">
        <button
          @click="handleLogin"
          :disabled="isLoginPending"
          class="flex h-[56px] w-[250px] items-center justify-center rounded-[28px] bg-white px-8 py-4 text-base font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ isLoginPending ? "Redirecting..." : "Login with Prividium" }}
        </button>
      </div>
      <p class="mt-6 text-center text-[14px] font-normal leading-[20px] text-gray-500">
        {{ t("loginView.onlyAuthorizedAdvice") }}
      </p>
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
