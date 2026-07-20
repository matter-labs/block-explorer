import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { mount } from "@vue/test-utils";
import { $fetch, FetchError } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import Account from "@/components/Account.vue";
import Contract from "@/components/Contract.vue";

import * as useAddress from "@/composables/useAddress";

import enUS from "@/locales/en.json";

import type { AddressItem } from "@/composables/useAddress";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import AddressView from "@/views/AddressView.vue";

const notFoundRoute = { name: "not-found", meta: { title: "404 Not Found" } };

const router = {
  resolve: vi.fn(() => notFoundRoute),
  replace: vi.fn(),
  currentRoute: {
    value: {},
  },
  beforeEach: vi.fn(),
};

vi.mock("@/composables/useSearch", () => {
  return {
    default: () => ({
      getSearchRoute: () => null,
    }),
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => ({
    query: {
      page: vi.fn(),
    },
  }),
  createWebHistory: () => vi.fn(),
  createRouter: () => ({ beforeEach: vi.fn() }),
}));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(),
    FetchError: function error() {
      return;
    },
  };
});

describe("AddressView: ", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "address")?.meta?.title as string)).toBe("Address");
  });

  it("renders Account component if address type 'account'", () => {
    const mockAddressItem = vi.spyOn(useAddress, "default").mockReturnValue({
      getByAddress(): Promise<void> {
        return Promise.resolve(undefined);
      },
      isRequestFailed: ref(false),
      isRequestPending: ref(false),
      item: ref<AddressItem>({
        type: "account",
        address: "0x5c221e77624690fff6dd741493d735a17716c26b",
        blockNumber: 123,
        balances: {},
        sealedNonce: 123,
        verifiedNonce: 123,
      }),
      getContractProxyInfo: async () => null,
    });
    const wrapper = mount(AddressView, {
      props: {
        address: "0x5c221e77624690fff6dd741493d735a17716c26b",
      },
      global: {
        plugins: [i18n, $testId],
        stubs: ["router-link"],
      },
    });
    expect(wrapper.findComponent(Account)).toBeTruthy();
    mockAddressItem.mockRestore();
  });
  it("renders Contract component if address type 'contract'", () => {
    const mockAddressItem = vi.spyOn(useAddress, "default").mockReturnValue({
      isRequestFailed: ref(false),
      isRequestPending: ref(false),
      item: ref<AddressItem>({
        type: "contract",
        address: "0x5c221e77624690fff6dd741493d735a17716c26b",
        blockNumber: 123,
        bytecode: "",
        creatorAddress: "0x06590AD9b721DD3d4fd2177d643799E552437904",
        creatorTxHash: "0xc3751ea2572cb6b4f061af1127a67eaded2cfc191f2a18d69000bbe2e98b680a",
        createdInBlockNumber: 123,
        totalTransactions: 31231,
        balances: {},
        verificationInfo: null,
      } as AddressItem),
      getByAddress(): Promise<void> {
        return Promise.resolve(undefined);
      },
      getContractProxyInfo: async () => null,
    });
    const wrapper = mount(AddressView, {
      props: {
        address: "0x0cc725e6ba24e7db79f62f22a7994a8ee33adc1b",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });
    expect(wrapper.findComponent(Contract)).toBeTruthy();
    mockAddressItem.mockRestore();
  });
  it("renders error message if isRequestFailed is equal to 'true'", () => {
    const mockAddressItem = vi.spyOn(useAddress, "default").mockReturnValue({
      getByAddress(): Promise<void> {
        return Promise.resolve(undefined);
      },
      isRequestFailed: ref(true),
      isRequestPending: ref(false),
      item: ref<AddressItem | null>(null),
      getContractProxyInfo: async () => null,
    });
    const wrapper = mount(AddressView, {
      props: {
        address: "0x5c221e77624690fff6dd741493d735a17716c26b",
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          PageError: {
            template: '<div class="account-error">An Error Occurred</div>',
          },
        },
      },
    });
    expect(wrapper.find(".account-error").text()).toBe("An Error Occurred");
    mockAddressItem.mockRestore();
  });
  it("route is replaced with not found view on request 404 error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = new FetchError("404");
    error.response = {
      status: 404,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(error);
    mount(AddressView, {
      props: {
        address: "0x5c221e77624690fff6dd741493d735a17716c26g",
      },
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(router.replace).toHaveBeenCalledWith(notFoundRoute);
    mock.mockRestore();
  });
});
