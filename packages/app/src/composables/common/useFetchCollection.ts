import { computed, type ComputedRef, ref, type Ref } from "vue";

import useFetch from "@/composables/useFetch";

export type UseFetchCollection<T> = {
  pending: ComputedRef<boolean>;
  failed: ComputedRef<boolean>;

  data: ComputedRef<T[] | null>;
  total: ComputedRef<null | number>;

  page: ComputedRef<null | number>;
  pageSize: ComputedRef<number>;

  load: (nextPage: number, toDate?: Date, pageSize?: number) => Promise<void>;
};

export function useFetchCollection<T, TApiResponse = T>(
  resource: URL | ((...params: unknown[]) => URL),
  itemMapper?: (apiResponse: TApiResponse) => T
): UseFetchCollection<T> {
  const data = ref<T[] | null>(null) as Ref<T[] | null>;

  const pending = ref(false);
  const failed = ref(false);

  const pageSize = ref(10);

  const page = ref<null | number>(null);
  const total = ref<null | number>(null);

  async function load(nextPage: number, toDate?: Date, updatedPageSize?: number) {
    page.value = nextPage;
    if (updatedPageSize) {
      pageSize.value = updatedPageSize;
    }

    pending.value = true;
    failed.value = false;

    try {
      const url = typeof resource === "function" ? resource() : resource;
      url.searchParams.set("limit", pageSize.value.toString());
      url.searchParams.set("page", nextPage.toString());

      if (toDate && +new Date(toDate) > 0) {
        url.searchParams.set("toDate", toDate.toISOString());
      }

      const response = await useFetch()<Api.Response.Collection<TApiResponse>>(url.toString());
      data.value = itemMapper ? response.items?.map((item) => itemMapper(item)) : (response.items as unknown as T[]);
      total.value = response.meta.totalItems;
    } catch (error) {
      failed.value = true;
      data.value = null;
    } finally {
      pending.value = false;
    }
  }

  return {
    pending: computed(() => pending.value),
    failed: computed(() => failed.value),

    data: computed(() => data.value),
    total: computed(() => total.value),

    page: computed(() => page.value),
    pageSize: computed(() => pageSize.value),

    load,
  };
}

export default useFetchCollection;
