import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import InfoTable from "@/components/blocks/InfoTable.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import Tooltip from "@/components/common/Tooltip.vue";

import enUS from "@/locales/en.json";

import type { Block } from "@/composables/useBlock";

import { localDateFromISOString } from "@/utils/helpers";

const l1ExplorerUrlMock = vi.fn((): string | null => "https://goerli.etherscan.io");
vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      currentNetwork: computed(() => ({ l1ExplorerUrl: l1ExplorerUrlMock() })),
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
          l1BatchNumber: 1,
          isL1BatchSealed: true,
          hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
          status: "verified",
          commitTxHash: "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2",
          committedAt: "2022-04-13T16:54:37.622380Z",
          proveTxHash: "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9",
          provenAt: "2022-04-13T16:54:37.700089Z",
          executeTxHash: "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364",
          executedAt: "2022-04-13T16:54:37.784185Z",
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
    expect(status[1].text()).toBe(i18n.global.t("blocks.status.verified"));
    const batch = rowArray[3].findAll("td");
    expect(batch[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.batch"));
    expect(batch[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.batchTooltip"));
    expect(batch[1].findComponent(RouterLinkStub).text()).toBe("1");
    const rootHash = rowArray[4].findAll("td");
    expect(rootHash[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.rootHash"));
    expect(rootHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.rootHashTooltip"));
    expect(rootHash[1].text()).toBe("0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e");
    const timestamp = rowArray[5].findAll("td");
    expect(timestamp[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.timestamp"));
    expect(timestamp[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.timestampTooltip"));
    expect(timestamp[1].text()).includes(localDateFromISOString("2022-04-13T16:48:32.000Z"));
    const commitHash = rowArray[6].findAll("td");
    expect(commitHash[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.commitTxHash"));
    expect(commitHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.commitTxHashTooltip"));
    expect(commitHash[1].text()).toBe("0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2");
    const committed = rowArray[7].findAll("td");
    expect(committed[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.committedAt"));
    expect(committed[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.committedAtTooltip"));
    expect(committed[1].text()).includes(localDateFromISOString("2022-04-13T16:54:37.622380Z"));
    const provenHash = rowArray[8].findAll("td");
    expect(provenHash[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.proveTxHash"));
    expect(provenHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.proveTxHashTooltip"));
    expect(provenHash[1].text()).toBe("0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9");
    const proven = rowArray[9].findAll("td");
    expect(proven[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.provenAt"));
    expect(proven[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.provenAtTooltip"));
    expect(proven[1].text()).includes(localDateFromISOString("2022-04-13T16:54:37.700089Z"));
    const executeHash = rowArray[10].findAll("td");
    expect(executeHash[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.executeTxHash"));
    expect(executeHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.executeTxHashTooltip"));
    expect(executeHash[1].text()).toBe("0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364");
    const executed = rowArray[11].findAll("td");
    expect(executed[0].find(".block-info-field-label").text()).toBe(i18n.global.t("blocks.table.executedAt"));
    expect(executed[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("blocks.table.executedAtTooltip"));
    expect(executed[1].text()).includes(localDateFromISOString("2022-04-13T16:54:37.784185Z"));
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
  it("renders commitTxHash url properly", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        block: <Block>{
          number: 1,
          timestamp: "2022-04-13T16:48:32.000Z",
          l1TxCount: 1,
          l2TxCount: 0,
          hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
          status: "verified",
          commitTxHash: "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2",
          committedAt: "2022-04-13T16:54:37.622380Z",
          proveTxHash: "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9",
          provenAt: "2022-04-13T16:54:37.700089Z",
          executeTxHash: "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364",
          executedAt: "2022-04-13T16:54:37.784185Z",
        },
        blockNumber: "1",
        loading: false,
      },
    });
    expect(wrapper.findAll("a")[0].attributes("href")).toEqual(
      "https://goerli.etherscan.io/tx/0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2"
    );
  });
  it("renders proveTxHash url properly", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        block: <Block>{
          number: 1,
          timestamp: "2022-04-13T16:48:32.000Z",
          l1TxCount: 1,
          l2TxCount: 0,
          hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
          status: "verified",
          commitTxHash: "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2",
          committedAt: "2022-04-13T16:54:37.622380Z",
          proveTxHash: "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9",
          provenAt: "2022-04-13T16:54:37.700089Z",
          executeTxHash: "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364",
          executedAt: "2022-04-13T16:54:37.784185Z",
        },
        blockNumber: "1",
        loading: false,
      },
    });
    expect(wrapper.findAll("a")[1].attributes("href")).toEqual(
      "https://goerli.etherscan.io/tx/0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9"
    );
  });
  it("renders executeTxHash url properly", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: {
        block: <Block>{
          number: 1,
          timestamp: "2022-04-13T16:48:32.000Z",
          l1TxCount: 1,
          l2TxCount: 0,
          hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
          status: "verified",
          commitTxHash: "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2",
          committedAt: "2022-04-13T16:54:37.622380Z",
          proveTxHash: "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9",
          provenAt: "2022-04-13T16:54:37.700089Z",
          executeTxHash: "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364",
          executedAt: "2022-04-13T16:54:37.784185Z",
        },
        blockNumber: "1",
        loading: false,
      },
    });
    expect(wrapper.findAll("a")[2].attributes("href")).toEqual(
      "https://goerli.etherscan.io/tx/0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364"
    );
  });
  it("renders batch number as text with tooltip when batch is not sealed yet", () => {
    const wrapper = mount(InfoTable, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          Tooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n],
      },
      props: {
        block: <Block>{
          number: 1,
          timestamp: "2022-04-13T16:48:32.000Z",
          l1TxCount: 1,
          l2TxCount: 0,
          l1BatchNumber: 1,
          isL1BatchSealed: false,
          hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
          status: "verified",
          commitTxHash: "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2",
          committedAt: "2022-04-13T16:54:37.622380Z",
          proveTxHash: "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9",
          provenAt: "2022-04-13T16:54:37.700089Z",
          executeTxHash: "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364",
          executedAt: "2022-04-13T16:54:37.784185Z",
        },
        blockNumber: "1",
        loading: false,
      },
    });
    const rowArray = wrapper.findAll("tr");
    const batch = rowArray[3].findAll("td");
    expect(batch[1].findComponent(Tooltip).find("span").text()).toBe("1");
    expect(batch[1].findComponent(RouterLinkStub).exists()).toBeFalsy();
  });
  describe("when L1 explorer url is not set", () => {
    let mock1ExplorerUrl: Mock;
    beforeEach(() => {
      mock1ExplorerUrl = l1ExplorerUrlMock.mockReturnValue(null);
    });

    afterEach(() => {
      mock1ExplorerUrl.mockRestore();
    });

    it("renders L1 hashes as texts instead of links", async () => {
      const wrapper = mount(InfoTable, {
        global: {
          plugins: [i18n],
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
        props: {
          block: <Block>{
            number: 1,
            timestamp: "2022-04-13T16:48:32.000Z",
            l1TxCount: 1,
            l2TxCount: 0,
            hash: "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e",
            status: "verified",
            commitTxHash: "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2",
            committedAt: "2022-04-13T16:54:37.622380Z",
            proveTxHash: "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9",
            provenAt: "2022-04-13T16:54:37.700089Z",
            executeTxHash: "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364",
            executedAt: "2022-04-13T16:54:37.784185Z",
          },
          blockNumber: "1",
          loading: false,
        },
      });
      expect(wrapper.findAll(".actual-string")[0].text()).toEqual(
        "0xcd7533748f8f0c8f406f366e83d5e92d174845405418745d0f7228b85025cd6e"
      );
      expect(wrapper.findAll(".actual-string")[1].text()).toEqual(
        "0x5b5a05691d974803f5f095c1b918d2dd19152ed0a9de506d545c96df6cb9cac2"
      );
      expect(wrapper.findAll(".actual-string")[2].text()).toEqual(
        "0xfb3532f4c38c2eaf78248da64cf80a354429d58204761d6ea6439391043f6fa9"
      );
      expect(wrapper.findAll(".actual-string")[3].text()).toEqual(
        "0x8d1a78d1da5aba1d0755ec9dbcba938f3920681d2a3d4d374ef265a50858f364"
      );
    });
  });
});
