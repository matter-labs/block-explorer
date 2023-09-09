import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import Pagination from "@/components/common/Pagination.vue";
import Logs from "@/components/transactions/infoTable/Logs.vue";

import enUS from "@/locales/en.json";

import type { TransactionLogEntry } from "@/composables/useEventLog";

import $testId from "@/plugins/testId";

const log = {
  logIndex: 0,
  address: "0x000000000000000000000000000000000000800a",
  data: "0x0000000000000000000000000000000000000000000000000000000000000001",
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000006cc8cf7f6b488c58aa909b77e6e65c631c204784",
    "0x000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
  ],
  event: {
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        value: "0x6cC8cf7f6b488C58AA909B77E6e65c631c204784",
      },
      {
        name: "to",
        type: "address",
        value: "0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044",
      },
      {
        name: "value",
        type: "uint256",
        value: "1",
      },
    ],
  },
};

const router = {
  push: vi.fn(),
};
const routeQueryMock = vi.fn(() => ({}));
vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => ({
    query: routeQueryMock(),
  }),
}));

describe("Logs", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("render components based on input", () => {
    const { container } = render(Logs, {
      props: {
        logs: [log],
        loading: false,
        initiatorAddress: "0x46848fa6e189b5e94c7b71566b3617e30a714403",
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".address-value-container")?.textContent).toBe(
      "0x000000000000000000000000000000000000800A"
    );
    expect(container.querySelector(".log-interface")?.textContent?.replace(/\u00a0/g, " ")).toBe(
      "Transfer (index_topic_1 address from, index_topic_2 address to, data uint256 value) "
    );
    const topicItem = container.querySelectorAll(".topic-container");
    expect(topicItem[0].querySelector(".topic-index-container")?.textContent).toBe("0");
    expect(topicItem[0].querySelector(".convert-dropdown-container")).toBe(null);

    expect(topicItem[1].querySelector(".topic-index-container")?.textContent).toBe("1");
    expect(topicItem[1].querySelector(".convert-dropdown-container")).toBeTruthy();

    expect(topicItem[2].querySelector(".topic-index-container")?.textContent).toBe("2");
    expect(topicItem[2].querySelector(".convert-dropdown-container")).toBeTruthy();

    expect(container.querySelector(".hash-label-component")?.textContent).toBe("1");
  });
  it("doesn't render interface row if log is not decoded", () => {
    const { container } = render(Logs, {
      props: {
        logs: [
          {
            ...log,
            event: undefined,
          },
        ],
        loading: false,
        initiatorAddress: "0x46848fa6e189b5e94c7b71566b3617e30a714403",
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
    });
    expect(container.querySelector(".log-interface")).toBe(null);
  });
  it("renders loading state", () => {
    const wrapper = mount(Logs, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(6);
  });

  describe("Pagination", () => {
    it("doesn't render pagination if amount of logs is 25 or less", () => {
      const wrapper = mount(Logs, {
        props: {
          logs: Array.from(
            { length: 25 },
            (_, i) =>
              ({
                ...log,
                logIndex: i.toString(),
              } as TransactionLogEntry)
          ),
          loading: false,
          initiatorAddress: "0x46848fa6e189b5e94c7b71566b3617e30a714403",
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
          plugins: [i18n, $testId],
        },
      });
      expect(wrapper.findComponent(Pagination).exists()).toBe(false);
    });
    it("renders page according to route page query param", () => {
      const mock = routeQueryMock.mockReturnValue({ page: 2 });
      const { container } = render(Logs, {
        props: {
          logs: [
            ...Array.from({ length: 25 }, (_, i) => ({
              ...log,
              logIndex: i,
            })),
            {
              ...log,
              logIndex: 26,
              address: "0xF44095b5f84c560011B901e0DeE5EB7DdF96fE8D",
            },
          ],
          loading: false,
          initiatorAddress: "0x46848fa6e189b5e94c7b71566b3617e30a714403",
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
          plugins: [i18n, $testId],
        },
      });
      expect(container.querySelector(".address-value-container")?.textContent).toBe(
        "0xF44095b5f84c560011B901e0DeE5EB7DdF96fE8D"
      );

      mock.mockRestore();
    });
  });
});
