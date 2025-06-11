import { computed, type ComputedRef, reactive, type Ref, type ToRefs, toRefs } from "vue";

import { BrowserProvider } from "ethers";

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

      // Get SIWE message from server
      const message = await FetchInstance.api(context)<string>(`/auth/message`, {
        method: "POST",
        body: { address },
      });

      // Sign the message
      const signature = await signer.signMessage(message);

      // Send signature to proxy
      try {
        await FetchInstance.api(context)(`/auth/verify`, {
          method: "POST",
          body: { signature, message },
        });
      } catch (error) {
        console.error("Verify request failed:", error);
        console.error("Request body:", { signature, message });
        throw error;
      }

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
