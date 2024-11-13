import { computed } from 'vue';

import { useStorage } from '@vueuse/core';
import { $fetch } from 'ohmyfetch';

import useContext, { type Context } from './useContext';

export const rpcToken = useStorage<string | null>('useRpcToken_rpcToken', null);

export const rpcUrl = computed(() => {
  const { currentNetwork } = useContext();
  const network = currentNetwork.value;
  const token = rpcToken.value;

  if (token === null) {
    return null;
  }
  return `${network.rpcUrl}/${token}`;
});

export default (context: Context) => {
  const updateRpcToken = async () => {
    if (rpcToken.value !== null) {
      return;
    }

    const response = await $fetch<{ ok: true; token: string }>(
      `${context.currentNetwork.value.apiUrl}/auth/token`,
      {
        credentials: 'include',
      },
    );
    rpcToken.value = response.token;
  };

  return {
    updateRpcToken,
  };
};
