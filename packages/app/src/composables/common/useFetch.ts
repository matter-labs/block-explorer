import { computed, type ComputedRef, ref, type Ref } from "vue";

import { $fetch } from "ohmyfetch";

export type UseFetch<T> = {
  pending: ComputedRef<boolean>;
  failed: ComputedRef<boolean>;

  item: ComputedRef<T | null>;

  fetch: (...params: string[]) => Promise<void>;
};

export function useFetch<T>(getRequestUrl: (...params: string[]) => URL): UseFetch<T> {
  const item = ref<T | null>(null) as Ref<T | null>;

  const pending = ref(false);
  const failed = ref(false);

  async function fetch(...params: string[]) {
    pending.value = true;
    failed.value = false;

    try {
      const response = await $fetch<T>(getRequestUrl(...params).toString());

      item.value = response;
    } catch (error) {
      failed.value = true;
      item.value = null;
    } finally {
      pending.value = false;
    }
  }

  return {
    pending: computed(() => pending.value),
    failed: computed(() => failed.value),

    item: computed(() => item.value),

    fetch,
  };
}

export default useFetch;
