import { type ComputedRef, reactive, type Ref, type ToRefs, toRefs } from "vue";

import detectEthereumProvider from "@metamask/detect-provider";
import { BrowserProvider } from "ethers";
import { $fetch } from "ohmyfetch";

import defaultLogger from "./../utils/logger";

import type { UserContext } from "./useContext";
import type { NetworkConfig } from "../configs";
import type { BaseProvider } from "@metamask/providers";
import type { Provider } from "zksync-ethers";

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

export default (
  context: {
    user: Ref<UserContext>;
    currentNetwork: ComputedRef<NetworkConfig>;
    getL2Provider: () => Provider;
  },
  _logger = defaultLogger
): UseLogin => {
  const getEthereumProvider = () =>
    detectEthereumProvider({
      mustBeMetaMask: true,
      silent: false,
    }) as Promise<BaseProvider | undefined>;

  const initializeLogin = async () => {
    try {
      const response = await $fetch<{ address: string }>(`${context.currentNetwork.value.apiUrl}/auth/me`, {
        credentials: "include",
      });
      if (response.address) {
        context.user.value = { address: response.address, loggedIn: true };
      }
    } catch {
      context.user.value = { loggedIn: false };
    }
  };

  const login = async () => {
    try {
      context.user.value = { loggedIn: false };
      state.isLoginPending = true;

      const ethereum = await getEthereumProvider();
      if (!ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Get SIWE message from server
      const message = await $fetch<string>(`${context.currentNetwork.value.apiUrl}/auth/message`, {
        method: "POST",
        body: { address },
        credentials: "include",
      });

      // Sign the message
      const signature = await signer.signMessage(message);

      // Send signature to proxy
      try {
        await $fetch(`${context.currentNetwork.value.apiUrl}/auth/verify`, {
          method: "POST",
          body: { signature, message },
          credentials: "include",
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
    await $fetch(`${context.currentNetwork.value.apiUrl}/auth/logout`, {
      credentials: "include",
      method: "POST",
    });
    context.user.value = { loggedIn: false };
  };

  return {
    ...toRefs(state),
    login,
    logout,
    initializeLogin,
  };
};
