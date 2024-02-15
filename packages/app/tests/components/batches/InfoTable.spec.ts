import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import InfoTable from "@/components/batches/InfoTable.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";

import enUS from "@/locales/en.json";

import type { BatchDetails } from "@/composables/useBatch";

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

  const batchItem: BatchDetails = {
    number: "42",
    size: 1,
    timestamp: "2023-02-08T16:08:16.000Z",
    l1TxCount: 9,
    l2TxCount: 0,
    rootHash: "0x8983f748ff6c2f9038904d65dc63a344db33c29d97f1741a931e90689f86b2be",
    status: "verified",
    commitTxHash: "0x0ab34d8523b67f80783305760a2989ffe6ab205621813db5420a3012845f5ac7",
    committedAt: "2023-02-08T16:16:18.247570Z",
    proveTxHash: "0x87c5c5bf78100d88766101f13ec78d3b3356929556ee971cfacb6fe2a53b210a",
    provenAt: "2023-02-08T16:16:38.475210Z",
    executeTxHash: "0x57c44d7c183633f81bfa155bd30e68a94e3ff12c1e6265a4b5e06b6d4a7a1fa8",
    executedAt: "2023-02-08T16:17:00.484429Z",
    l1GasPrice: "39190145992",
    l2FairGasPrice: "500000000",
  };

  it("renders table based on input", () => {
    const wrapper = mount(InfoTable, {
      global: {
        stubs: {
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n],
      },
      props: {
        batch: batchItem,
        batchNumber: batchItem.number.toString(),
        loading: false,
      },
    });

    const rowArray = wrapper.findAll("tr");

    const batchIndex = rowArray[0].findAll("td");
    expect(batchIndex[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.index"));
    expect(batchIndex[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.indexTooltip"));
    expect(batchIndex[1].text()).toBe("42");

    const batchSize = rowArray[1].findAll("td");
    expect(batchSize[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.size"));
    expect(batchSize[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.sizeTooltip"));
    expect(batchSize[1].text()).toBe("9");

    const timestamp = rowArray[2].findAll("td");
    expect(timestamp[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.timestamp"));
    expect(timestamp[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.timestampTooltip"));
    expect(timestamp[1].text()).includes(localDateFromISOString("2023-02-08T16:08:16.000Z"));

    const rootHash = rowArray[3].findAll("td");
    expect(rootHash[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.rootHash"));
    expect(rootHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.rootHashTooltip"));
    expect(rootHash[1].text()).toBe("0x8983f748ff6c2f9038904d65dc63a344db33c29d97f1741a931e90689f86b2be");

    const commitHash = rowArray[4].findAll("td");
    expect(commitHash[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.commitTxHash"));
    expect(commitHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.commitTxHashTooltip"));
    expect(commitHash[1].text()).toBe("0x0ab34d8523b67f80783305760a2989ffe6ab205621813db5420a3012845f5ac7");

    const committed = rowArray[5].findAll("td");
    expect(committed[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.committedAt"));
    expect(committed[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.committedAtTooltip"));
    expect(committed[1].text()).includes(localDateFromISOString("2023-02-08T16:16:18.247570Z"));

    const provenHash = rowArray[6].findAll("td");
    expect(provenHash[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.proveTxHash"));
    expect(provenHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.proveTxHashTooltip"));
    expect(provenHash[1].text()).toBe("0x87c5c5bf78100d88766101f13ec78d3b3356929556ee971cfacb6fe2a53b210a");

    const proven = rowArray[7].findAll("td");
    expect(proven[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.provenAt"));
    expect(proven[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.provenAtTooltip"));
    expect(proven[1].text()).includes(localDateFromISOString("2023-02-08T16:16:38.475210Z"));

    const executeHash = rowArray[8].findAll("td");
    expect(executeHash[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.executeTxHash"));
    expect(executeHash[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.executeTxHashTooltip"));
    expect(executeHash[1].text()).toBe("0x57c44d7c183633f81bfa155bd30e68a94e3ff12c1e6265a4b5e06b6d4a7a1fa8");

    const executed = rowArray[9].findAll("td");
    expect(executed[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.executedAt"));
    expect(executed[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.executedAtTooltip"));
    expect(executed[1].text()).includes(localDateFromISOString("2023-02-08T16:17:00.484429Z"));

    wrapper.unmount();
  });

  describe("when batch is not set", () => {
    it("renders only batch number", () => {
      const wrapper = mount(InfoTable, {
        global: {
          stubs: {
            InfoTooltip: { template: "<div><slot /></div>" },
          },
          plugins: [i18n],
        },
        props: {
          batchNumber: batchItem.number.toString(),
          loading: false,
        },
      });

      const rowArray = wrapper.findAll("tr");
      expect(rowArray.length).toBe(1);

      const batchIndex = rowArray[0].findAll("td");
      expect(batchIndex[0].find(".batch-info-field-label").text()).toBe(i18n.global.t("batches.index"));
      expect(batchIndex[0].findComponent(InfoTooltip).text()).toBe(i18n.global.t("batches.indexTooltip"));
      expect(batchIndex[1].text()).toBe("42");
      wrapper.unmount();
    });
  });

  it("renders loading state", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
      },
      props: {
        loading: true,
        batchNumber: batchItem.number.toString(),
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(20);
    wrapper.unmount();
  });
  it("renders urls properly", () => {
    const wrapper = mount(InfoTable, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n],
      },
      props: {
        batch: batchItem,
        loading: false,
        batchNumber: batchItem.number.toString(),
      },
    });

    expect(wrapper.findAll("a")[0].attributes("href")).toEqual(
      "https://goerli.etherscan.io/tx/0x0ab34d8523b67f80783305760a2989ffe6ab205621813db5420a3012845f5ac7"
    );
    expect(wrapper.findAll("a")[1].attributes("href")).toEqual(
      "https://goerli.etherscan.io/tx/0x87c5c5bf78100d88766101f13ec78d3b3356929556ee971cfacb6fe2a53b210a"
    );
    expect(wrapper.findAll("a")[2].attributes("href")).toEqual(
      "https://goerli.etherscan.io/tx/0x57c44d7c183633f81bfa155bd30e68a94e3ff12c1e6265a4b5e06b6d4a7a1fa8"
    );
    wrapper.unmount();
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
          stubs: {
            RouterLink: RouterLinkStub,
          },
          plugins: [i18n],
        },
        props: {
          batch: batchItem,
          batchNumber: batchItem.number.toString(),
          loading: false,
        },
      });
      expect(wrapper.findAll(".actual-string")[0].text()).toEqual(
        "0x8983f748ff6c2f9038904d65dc63a344db33c29d97f1741a931e90689f86b2be"
      );
      expect(wrapper.findAll(".actual-string")[1].text()).toEqual(
        "0x0ab34d8523b67f80783305760a2989ffe6ab205621813db5420a3012845f5ac7"
      );
      expect(wrapper.findAll(".actual-string")[2].text()).toEqual(
        "0x87c5c5bf78100d88766101f13ec78d3b3356929556ee971cfacb6fe2a53b210a"
      );
      expect(wrapper.findAll(".actual-string")[3].text()).toEqual(
        "0x57c44d7c183633f81bfa155bd30e68a94e3ff12c1e6265a4b5e06b6d4a7a1fa8"
      );
      wrapper.unmount();
    });
  });
});
