import { reactive, type ToRefs, toRefs } from "vue";
import { useRouter } from "vue-router";

import defaultLogger from "./../utils/logger";
import { FetchInstance } from "./useFetchInstance";

import type { Context } from "./useContext";

import { PrividiumAuth } from "@/lib/prividium-auth";

type LoginState = {
  isLoginPending: boolean;
};

type UseLogin = ToRefs<LoginState> & {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initializeLogin: () => Promise<void>;
  handlePrividiumCallback: () => Promise<void>;
};

const state = reactive<LoginState>({
  isLoginPending: false,
});

let prividiumAuth: PrividiumAuth | null = null;

export default (context: Context, _logger = defaultLogger): UseLogin => {
  const router = useRouter();

  const getPrividiumAuth = () => {
    if (!context.currentNetwork.value.prividium) {
      throw new Error("Prividium authentication is not configured for this network");
    }

    if (!prividiumAuth) {
      prividiumAuth = new PrividiumAuth({
        clientId: "block-explorer",
        redirectUri: new URL("auth/callback", window.location.origin).toString(),
        userPanelUrl: context.currentNetwork.value.userPanelUrl!,
      });
    }

    return prividiumAuth;
  };

  const initializeLogin = async () => {
    try {
      const response = await FetchInstance.api(context)<{ address: string }>("/auth/me");
      if (response.address) {
        context.user.value = { address: response.address, loggedIn: true };
      }
    } catch {
      await logout();
    }
  };

  const login = async () => {
    try {
      state.isLoginPending = true;
      const auth = getPrividiumAuth();
      auth.login();
    } catch (error) {
      _logger.error("Prividium login failed:", error);
      throw error;
    } finally {
      state.isLoginPending = false;
    }
  };

  const handlePrividiumCallback = async () => {
    try {
      state.isLoginPending = true;
      const auth = getPrividiumAuth();
      const result = auth.handleCallback();

      if (result && result.token) {
        // Exchange JWT for cookie session
        const response = await FetchInstance.api(context)("/auth/login", {
          method: "POST",
          body: { token: result.token },
        });
        context.user.value = { address: response.address, loggedIn: true };
      }
    } catch (err) {
      _logger.error("Prividium callback failed:", err);
      throw err;
    } finally {
      state.isLoginPending = false;
    }
  };

  const logout = async () => {
    const auth = getPrividiumAuth();
    auth.clearToken();

    try {
      await FetchInstance.api(context)("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      _logger.error("Logout failed:", error);
    }
    context.user.value = { loggedIn: false };
    router.push("/login");
  };

  return {
    ...toRefs(state),
    login,
    logout,
    initializeLogin,
    handlePrividiumCallback,
  };
};
