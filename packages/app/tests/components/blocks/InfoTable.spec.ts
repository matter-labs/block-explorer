import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import InfoTable from "@/components/blocks/InfoTable.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";

import enUS from "@/locales/en.json";

import type { Block } from "@/composables/useBlock";

import { localDateFromISOString } from "@/utils/helpers";

const l1ExplorerUrlMock = vi.fn((): string | null => "https://sepolia.etherscan.io/");
vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      getSettlementChainExplorerUrl: l1ExplorerUrlMock,
    }),
  };
});

describe("InfoTable:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders table based on input", () => {
    const wrapper = mount(InfoTable, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n],
      },
      props: {
        block: <Block>{
          number: 1,
          timestamp: "2022-04-13T16:48:32.000Z",
          l1TxCount: 1,
          l2TxCount: 0,
          hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
          status: "executed",
        },
        blockNumber: "1",
        loading: false,
      },
    });

    const rowArray = wrapper.findAll("tr");
    const blockNumber = rowArray[0].findAll("td");
    expect(blockNumber[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.blockNumber"));
    expect(blockNumber[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.blockNumberTooltip"));
    expect(blockNumber[1].text()).toBe("1");
    const blockSize = rowArray[1].findAll("td");
    expect(blockSize[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.blockSize"));
    expect(blockSize[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.blockSizeTooltip"));
    expect(blockSize[1].text()).toBe("1");
    const status = rowArray[2].findAll("td");
    expect(status[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.status"));
    expect(status[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.statusTooltip"));
    expect(status[1].text()).toBe(i18n.global.t("blocks.status.executed"));
    const blockHash = rowArray[3].findAll("td");
    expect(blockHash[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.blockHash"));
    expect(blockHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.blockHashTooltip"));
    expect(blockHash[1].text()).toBe("0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e");
    const timestamp = rowArray[4].findAll("td");
    expect(timestamp[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.timestamp"));
    expect(timestamp[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.timestampTooltip"));
    expect(timestamp[1].text()).includes(localDateFromISOString("2022-04-13T16:48:32.000Z"));
  });
  describe("when block is not set", () => {
    it("renders only block number", () => {
      const wrapper = mount(InfoTable, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
            InfoTooltip: { template: "<div><slot /></div>" },
          },
          plugins: [i18n],
        },
        props: {
          blockNumber: "1",
          loading: false,
        },
      });

      const rowArray = wrapper.findAll("tr");
      expect(rowArray.length).toBe(1);

      const blockNumber = rowArray[0].findAll("td");
      expect(blockNumber[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.blockNumber"));
      expect(blockNumber[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.blockNumberTooltip"));
      expect(blockNumber[1].text()).toBe("1");

      wrapper.unmount();
    });
  });
  it("renders loading state", () => {
    const wrapper = mount(InfoTable, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n],
      },
      props: {
        loading: true,
        blockNumber: "1",
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(24);
  });
});
