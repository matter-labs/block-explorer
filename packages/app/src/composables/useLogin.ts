import { reactive, type ToRefs, toRefs } from "vue";

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
  const getPrividiumAuth = () => {
    if (!context.currentNetwork.value.prividium) {
      return null;
    }

    if (!prividiumAuth) {
      prividiumAuth = new PrividiumAuth({
        clientId: "block-explorer",
        redirectUri: `${window.location.origin}/auth/callback`,
        userPanelUrl: context.currentNetwork.value.userPanelUrl,
      });
    }

    return prividiumAuth;
  };

  const initializeLogin = async () => {
    try {
      const response = await FetchInstance.api(context)<{ address: string }>(`/auth/me`);
      if (response.address) {
        context.user.value = { address: response.address, loggedIn: true };
      }
    } catch {
      await logout();
    }
  };

  const login = async () => {
    const auth = getPrividiumAuth();
    if (!auth) {
      throw new Error("Prividium authentication is not configured for this network");
    }

    state.isLoginPending = true;

    try {
      auth.login();
    } catch (error) {
      state.isLoginPending = false;
      _logger.error("Prividium login failed:", error);
      throw error;
    }
  };

  const handlePrividiumCallback = async () => {
    const auth = getPrividiumAuth();
    if (!auth) {
      throw new Error("Prividium authentication is not configured");
    }

    try {
      state.isLoginPending = true;
      const result = auth.handleCallback();

      if (result && result.token) {
        // Exchange JWT for cookie session
        const response = await FetchInstance.api(context)("/auth/login", {
          method: "POST",
          body: { token: result.token },
        });

        context.user.value = { address: response.address, loggedIn: true };
      }
    } catch (error) {
      _logger.error("Prividium callback failed:", error);
      throw error;
    } finally {
      state.isLoginPending = false;
    }
  };

  const logout = async () => {
    const auth = getPrividiumAuth();
    auth?.clearToken();

    try {
      await FetchInstance.api(context)("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      _logger.error("Logout failed:", error);
    }
    context.user.value = { loggedIn: false };
  };

  return {
    ...toRefs(state),
    login,
    logout,
    initializeLogin,
    handlePrividiumCallback,
  };
};
