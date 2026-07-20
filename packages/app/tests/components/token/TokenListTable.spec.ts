import { computed, nextTick } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import TokenListTable from "@/components/token/TokenListTable.vue";

import useToken, { type Token } from "@/composables/useToken";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

const router = {
  push: vi.fn(),
};
vi.mock("vue-router", () => ({
  useRouter: () => router,
}));

vi.mock("@/composables/useToken", () => {
  return {
    default: () => ({
      getTokenInfo: () => undefined,
      tokenInfo: computed(() => ({
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        usdPrice: 150,
      })),
    }),
  };
});

describe("TokenListTable:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders properly with bridged token", async () => {
    const { getTokenInfo } = useToken();
    const wrapper = mount(TokenListTable, {
      props: {
        tokens: [
          {
            decimals: 18,
            iconURL: "https://icon.com",
            l1Address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            l2Address: "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E",
            name: "Ether",
            symbol: "ETH",
          } as Token,
        ],
        loading: false,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await getTokenInfo("0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E");
    await nextTick();
    const trArr = wrapper.findAll("tbody tr");
    expect(trArr.length).toBe(1);
    const tr0Arr = trArr[0].findAll(".table-body-col");
    expect(tr0Arr.length).toBe(4);
    expect(tr0Arr[0].find(".token-symbol").text()).toBe("ETH");
    expect(tr0Arr[0].find(".token-name").text()).toBe("Ether");
    expect(tr0Arr[0].find(".token-icon-label img").attributes("src")).toBe("https://icon.com");
    expect(tr0Arr[0].find(".verified-badge").text()).toBe("Bridged");
    expect(tr0Arr[1].text()).toBe("$150.00");
    expect(tr0Arr[2].text()).toBe("L20x5A7d6b2F92C7...af3E");
    expect(tr0Arr[3].text()).toBe("L10xEee...EEeE");
  });

  it("renders properly with native token", async () => {
    const { getTokenInfo } = useToken();
    const wrapper = mount(TokenListTable, {
      props: {
        tokens: [
          {
            decimals: 18,
            iconURL: "https://icon.com",
            l2Address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            name: "Ether",
            symbol: "ETH",
          } as Token,
        ],
        loading: false,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    await getTokenInfo("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    await nextTick();
    const trArr = wrapper.findAll("tbody tr");
    expect(trArr.length).toBe(1);
    const tr0Arr = trArr[0].findAll(".table-body-col");
    expect(tr0Arr.length).toBe(4);
    expect(tr0Arr[0].find(".token-symbol").text()).toBe("ETH");
    expect(tr0Arr[0].find(".token-name").text()).toBe("Ether");
    expect(tr0Arr[0].find(".token-icon-label img").attributes("src")).toBe("https://icon.com");
    expect(tr0Arr[0].find(".verified-badge").text()).toBe("L2-native");
    expect(tr0Arr[1].text()).toBe("$150.00");
    expect(tr0Arr[2].text()).toBe("L20xEeeeeEeeeEeE...EEeE");
    expect(tr0Arr[3].text()).toBe("");
  });
});
