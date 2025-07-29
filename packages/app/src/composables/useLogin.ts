import { computed, reactive, type ToRefs, toRefs } from "vue";

import { BrowserProvider } from "ethers";
import { SiweMessage } from "siwe";
import z from "zod";

import defaultLogger from "./../utils/logger";
import { FetchInstance } from "./useFetchInstance";
import useWallet, { isAuthenticated } from "./useWallet";

import type { Context } from "./useContext";

type LoginState = {
  isLoginPending: boolean;
};

type UseLogin = ToRefs<LoginState> & {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initializeLogin: () => Promise<void>;
};

const state = reactive<LoginState>({
  isLoginPending: false,
});

export default (context: Context, _logger = defaultLogger): UseLogin => {
  const wallet = useWallet({
    ...context,
    currentNetwork: computed(() => ({
      explorerUrl: context.currentNetwork.value.rpcUrl,
      chainName: context.currentNetwork.value.l2NetworkName,
      l1ChainId: 0,
      ...context.currentNetwork.value,
    })),
  });

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
    try {
      context.user.value = { loggedIn: false };
      state.isLoginPending = true;

      const ethereum = await wallet.getEthereumProvider();
      if (!ethereum) {
        throw new Error("MetaMask not found");
      }

      await wallet.connect();
      if (!isAuthenticated.value) {
        return;
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Get SIWE message from Prividium Proxy
      const message = await FetchInstance.prividiumProxy(context)<string>("/auth/siwe-msg", {
        method: "POST",
        body: { address, domain: window.location.host },
      });

      // Validate SIWE message
      try {
        new SiweMessage(message);
      } catch (error) {
        console.error("Invalid SIWE message returned by Prividium Proxy:", error);
        throw new Error("Invalid SIWE message returned by Prividium Proxy");
      }

      // Sign the message
      const signature = await signer.signMessage(message);

      // Verify signature with Prividium Proxy
      const proxyResponse = await FetchInstance.prividiumProxy(context)("/auth/siwe-jwt", {
        method: "POST",
        body: { signature, message },
      });
      const { success, data: proxyResponseData } = z.object({ token: z.string() }).safeParse(proxyResponse);
      if (!success) {
        throw new Error("Invalid response from Prividium Proxy");
      }

      // Exchange JWT for cookie in API
      await FetchInstance.api(context)("/auth/login", { method: "POST", body: { token: proxyResponseData.token } });

      context.user.value = { address, loggedIn: true };
    } catch (error) {
      context.user.value = { loggedIn: false };
      _logger.error("Login failed:", error);
      throw error;
    } finally {
      state.isLoginPending = false;
    }
  };

  const logout = async () => {
    wallet.disconnect();
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
  };
};
