import detectEthereumProvider from "@metamask/detect-provider";
import { BrowserProvider } from "ethers";
import { SiweMessage } from "siwe";

import defaultLogger from "./../utils/logger";

import type { BaseProvider } from "@metamask/providers";
import { reactive, type ToRefs, toRefs, type ComputedRef, type Ref } from "vue";
import type { Provider } from "zksync-ethers";
import { $fetch } from "ohmyfetch";
import type { NetworkConfig } from "../configs";
import type { UserContext } from "./useContext";

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
  logger = defaultLogger
): UseLogin => {
  const getEthereumProvider = () =>
    detectEthereumProvider({
      mustBeMetaMask: true,
      silent: false,
    }) as Promise<BaseProvider | undefined>;

  const initializeLogin = async () => {
    try {
      const response = await $fetch<{ address: string }>(`${context.currentNetwork.value.apiUrl}/auth/user`, {
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
    context.user.value = { loggedIn: false };
    state.isLoginPending = true;

    const ethereum = await getEthereumProvider();
    const provider = new BrowserProvider(ethereum!);
    const signer = await provider.getSigner();

    // Get nonce from proxy
    const nonce = await $fetch<string>(`${context.currentNetwork.value.apiUrl}/auth/nonce`, { credentials: "include" });

    // Create SIWE message
    const address = await signer.getAddress();
    const message = new SiweMessage({
      domain: "localhost",
      address,
      statement: "Sign in with Ethereum",
      uri: "http://localhost:3010",
      version: "1",
      chainId: context.currentNetwork.value.l2ChainId,
      nonce,
    }).prepareMessage();
    const signature = await signer.signMessage(message);

    // Send signature to proxy
    await $fetch(`${context.currentNetwork.value.apiUrl}/auth/verify`, {
      method: "POST",
      body: { signature, message },
      credentials: "include",
    });
    state.isLoginPending = false;
    context.user.value = { address, loggedIn: true };
  };

  const logout = async () => {
    await $fetch(`${context.currentNetwork.value.apiUrl}/auth/logout`, { credentials: "include" });
    context.user.value = { loggedIn: false };
  };

  return {
    ...toRefs(state),
    login,
    logout,
    initializeLogin,
  };
};
