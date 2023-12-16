import { computed, nextTick } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import { ETH_TOKEN_MOCK } from "../../mocks";

import Badge from "@/components/common/Badge.vue";
import Tooltip from "@/components/common/Tooltip.vue";
import Table from "@/components/transactions/infoTable/GeneralInfo.vue";
import TransactionData from "@/components/transactions/infoTable/TransactionData.vue";

import enUS from "@/locales/en.json";

import type { TransactionItem } from "@/composables/useTransaction";

import $testId from "@/plugins/testId";

const transaction: TransactionItem = {
  hash: "0x9c526cc47ca2d3f72b7997a61d890d72951a283fa05d08df058ff8a629cffa3c",
  blockHash: "0x1fc6a30903866bf91cede9f831e71f2c7ba0dd023ffc044fe469c51b215d950b",
  blockNumber: 1162235,
  data: {
    contractAddress: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
    calldata:
      "0xa9059cbb00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36000000000000000000000000000000000000000000000000000000000000000c",
    sighash: "0xa9059cbb",
    value: "0",
  },
  value: "0",
  from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
  to: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
  ethCommitTxHash: "0xe6a7ed0b6bf1c49f27feae3a71e5ba2aa4abaa6e372524369529946eb61a6936",
  ethExecuteTxHash: "0xdd70c8c2f59d88b9970c3b48a1230320f051d4502d0277124db481a42ada5c33",
  ethProveTxHash: "0x688c20e2106984bb0ccdadecf01e7bf12088b0ba671d888eca8e577ceac0d790",
  fee: "0x521f303519100",
  feeData: {
    amountPaid: "0x521f303519100",
    isPaidByPaymaster: false,
    refunds: [
      {
        amount: "116665569251910",
        from: "0x0000000000000000000000000000000000008001",
        to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
        fromNetwork: "L2",
        toNetwork: "L2",
        type: "refund",
        tokenInfo: {
          address: "0x000000000000000000000000000000000000800A",
          l1Address: "0x0000000000000000000000000000000000000000",
          l2Address: "0x000000000000000000000000000000000000800A",
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
        },
      },
      {
        amount: "867466250000000",
        from: "0x0000000000000000000000000000000000008001",
        to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
        fromNetwork: "L2",
        toNetwork: "L2",
        type: "refund",
        tokenInfo: {
          address: "0x000000000000000000000000000000000000800A",
          l1Address: "0x0000000000000000000000000000000000000000",
          l2Address: "0x000000000000000000000000000000000000800A",
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
        },
      },
    ],
    amountRefunded: "0x037f100b7fa8c6",
  },
  indexInBlock: 0,
  isL1Originated: false,
  nonce: 24,
  receivedAt: "2023-02-28T08:42:08.198Z",
  status: "verified",
  l1BatchNumber: 11014,
  isL1BatchSealed: true,
  logs: [
    {
      address: "0x000000000000000000000000000000000000800A",
      blockNumber: 1162235,
      data: "0x000000000000000000000000000000000000000000000000000314f4b9af9680",
      logIndex: "3",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000008001",
        "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
      ],
      transactionHash: "0x9c526cc47ca2d3f72b7997a61d890d72951a283fa05d08df058ff8a629cffa3c",
      transactionIndex: "0",
    },
    {
      address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
      blockNumber: 1162235,
      data: "0x000000000000000000000000000000000000000000000000000000000000000c",
      logIndex: "2",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
        "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
      ],
      transactionHash: "0x9c526cc47ca2d3f72b7997a61d890d72951a283fa05d08df058ff8a629cffa3c",
      transactionIndex: "0",
    },
    {
      address: "0x000000000000000000000000000000000000800A",
      blockNumber: 1162235,
      data: "0x00000000000000000000000000000000000000000000000000006a1b51d01246",
      logIndex: "1",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000008001",
        "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
      ],
      transactionHash: "0x9c526cc47ca2d3f72b7997a61d890d72951a283fa05d08df058ff8a629cffa3c",
      transactionIndex: "0",
    },
    {
      address: "0x000000000000000000000000000000000000800A",
      blockNumber: 1162235,
      data: "0x00000000000000000000000000000000000000000000000000058c0e5521a346",
      logIndex: "0",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x00000000000000000000000008d211e22db19741ff25838a22e4e696fee7ed36",
        "0x0000000000000000000000000000000000000000000000000000000000008001",
      ],
      transactionHash: "0x9c526cc47ca2d3f72b7997a61d890d72951a283fa05d08df058ff8a629cffa3c",
      transactionIndex: "0",
    },
  ],
  transfers: [
    {
      amount: "12",
      from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
      to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
      fromNetwork: "L2",
      toNetwork: "L2",
      type: "transfer",
      tokenInfo: {
        address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
        l1Address: undefined,
        l2Address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
        decimals: 18,
        name: "Your Token Name",
        symbol: "YourTokenSymbol",
      },
    },
    {
      amount: null,
      from: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
      to: "0x08d211E22dB19741FF25838A22e4e696FeE7eD36",
      fromNetwork: "L2",
      toNetwork: "L2",
      type: "transfer",
      tokenInfo: {
        address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
        l1Address: undefined,
        l2Address: "0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C",
        decimals: 18,
        name: "Your Token Name",
        symbol: "NoAmountTransfer",
      },
    },
  ],
  gasPrice: "4000",
  gasLimit: "5000",
  gasUsed: "3000",
  gasPerPubdata: "800",
  maxFeePerGas: "7000",
  maxPriorityFeePerGas: "8000",
};

vi.mock("@/composables/useToken", () => {
  return {
    default: () => ({
      getTokenInfo: vi.fn(),
      tokenInfo: computed(() => ETH_TOKEN_MOCK),
      isRequestPending: computed(() => false),
    }),
  };
});

describe("Transaction info table", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders verified transaction properly", async () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: transaction,
        loading: false,
      },
    });
    await nextTick();
    const [
      txHash,
      status,
      block,
      batch,
      from,
      to,
      tokensTransferred,
      inputData,
      value,
      fee,
      gasLimitAndUsed,
      gasPerPubdata,
      nonce,
      createdAt,
    ] = wrapper.findAll("tbody tr td:nth-child(2)");
    expect(txHash.find(".displayed-string").text()).toBe("0x9c526cc47ca...ff8a629cffa3c");

    const badges = status.findAllComponents(Badge);
    expect(badges.length).toBe(5);
    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validated") +
        i18n.global.t("transactions.statusComponent.executed")
    );
    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.executed"));
    expect(block.findComponent(RouterLinkStub).text()).toBe("#1162235");
    expect(batch.findComponent(RouterLinkStub).text()).toBe("#11014");

    expect(from.text()).toBe("0x08d211E22dB19741FF25838A22e4e696FeE7eD36");
    expect(to.text()).toBe("0x1bAbcaeA2e4BE1f1e1A149c454806F2D21d7f47C");
    const transfers = tokensTransferred.findAll(".transfer-container").map((row) => ({
      from: row.findComponent(RouterLinkStub).text(),
      to: row.findAllComponents(RouterLinkStub)[1].text(),
      amount: `${row.find(".transfer-amount-value").text()} ${row.find(".token-symbol").text()}`,
    }));
    expect(transfers).toEqual([
      {
        from: "0x08d211E22dB...eD36",
        to: "0x08d211E22dB...eD36",
        amount: "0.000000000000000012 YourTokenSymbol",
      },
    ]);
    expect(inputData.find(".displayed-string").text()).toBe("0xa9059cbb000...000000000000c");
    expect(`${value.find(".token-amount").text()} ${fee.find(".token-symbol").text()}`).toBe("0 ETH");
    expect(`${fee.find(".token-amount").text()} ${fee.find(".token-symbol").text()}`).toBe("0.0014447025 ETH");

    expect(gasLimitAndUsed.text()).toBe("5000 | 3000 (60%)");
    expect(gasPerPubdata.text()).toBe("800");
    expect(nonce.text()).toBe("24");
    expect(createdAt.find(".full-date").text()).toBe("2023-02-28 11:42");

    const [
      txHashTooltip,
      statusTooltip,
      blockTooltip,
      batchTooltip,
      fromTooltip,
      toTooltip,
      tokensTransferredTooltip,
      inputDataTooltip,
      valueTooltip,
      feeTooltip,
      gasLimitAndUsedTooltip,
      gasPerPubdataTooltip,
      nonceTooltip,
      createdAtTooltip,
    ] = wrapper.findAll("tbody .transaction-info-field-tooltip").map((e) => e.text());
    expect(txHashTooltip).toBe(i18n.global.t("transactions.table.transactionHashTooltip"));
    expect(statusTooltip).toBe(i18n.global.t("transactions.table.statusTooltip"));
    expect(blockTooltip).toBe(i18n.global.t("transactions.table.blockTooltip"));
    expect(batchTooltip).toBe(i18n.global.t("transactions.table.batchTooltip"));
    expect(fromTooltip).toBe(i18n.global.t("transactions.table.fromTooltip"));
    expect(toTooltip).toBe(i18n.global.t("transactions.table.toTooltip"));
    expect(tokensTransferredTooltip).toBe(i18n.global.t("transactions.table.tokensTransferredTooltip"));
    expect(inputDataTooltip).toBe(i18n.global.t("transactions.table.inputDataTooltip"));
    expect(valueTooltip).toBe(i18n.global.t("transactions.table.valueTooltip"));
    expect(feeTooltip).toBe(i18n.global.t("transactions.table.feeTooltip"));
    expect(gasLimitAndUsedTooltip).toBe(i18n.global.t("transactions.table.gasLimitAndUsedTooltip"));
    expect(gasPerPubdataTooltip).toBe(i18n.global.t("transactions.table.gasPerPubdataTooltip"));
    expect(nonceTooltip).toBe(i18n.global.t("transactions.table.nonceTooltip"));
    expect(createdAtTooltip).toBe(i18n.global.t("transactions.table.createdTooltip"));
  });
  it("renders indexing transaction status", async () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: { ...transaction, status: "indexing" },
        loading: false,
      },
    });
    await nextTick();
    const status = wrapper.findAll("tbody tr td:nth-child(2)")[1];
    const badges = status.findAllComponents(Badge);

    const [l2StatusBadgeTitle, l2StatusBadgeValue, indexingBadge] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(indexingBadge.text()).toBe(i18n.global.t("transactions.statusComponent.indexing"));
  });
  it("renders failed transaction status", async () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: { ...transaction, status: "failed", revertReason: "Revert reason" },
        loading: false,
      },
    });
    await nextTick();
    const status = wrapper.findAll("tbody tr td:nth-child(2)")[1];
    const badges = status.findAllComponents(Badge);
    const reason = wrapper.find(".transaction-reason-value");
    expect(badges.length).toBe(1);
    expect(badges[0].text()).toBe(i18n.global.t("transactions.statusComponent.failed"));
    expect(reason.text()).toBe("Revert reason");
  });
  it("renders included transaction status", async () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: { ...transaction, status: "included" },
        loading: false,
      },
    });
    await nextTick();
    const status = wrapper.findAll("tbody tr td:nth-child(2)")[1];
    const badges = status.findAllComponents(Badge);
    expect(badges.length).toBe(5);
    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sending") +
        i18n.global.t("transactions.statusComponent.validating") +
        i18n.global.t("transactions.statusComponent.executing")
    );
    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.sending"));
  });
  it("renders committed transaction status", async () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: { ...transaction, status: "committed" },
        loading: false,
      },
    });
    await nextTick();
    const status = wrapper.findAll("tbody tr td:nth-child(2)")[1];
    const badges = status.findAllComponents(Badge);
    expect(badges.length).toBe(5);
    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validating") +
        i18n.global.t("transactions.statusComponent.executing")
    );
    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.validating"));
  });
  it("renders proved transaction status", async () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          InfoTooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: { ...transaction, status: "proved" },
        loading: false,
      },
    });
    await nextTick();
    const status = wrapper.findAll("tbody tr td:nth-child(2)")[1];
    const badges = status.findAllComponents(Badge);
    expect(badges.length).toBe(5);
    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validated") +
        i18n.global.t("transactions.statusComponent.executing")
    );
    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.executing"));
  });
  it("renders batch number as text with tooltip when batch is not sealed yet", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          Tooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: {
          ...transaction,
          isL1BatchSealed: false,
        },
        loading: false,
      },
    });
    const rowArray = wrapper.findAll("tr");
    const batch = rowArray[3].findAll("td");
    expect(batch[1].findComponent(Tooltip).find("span").text()).toBe("#11014");
    expect(batch[1].findComponent(RouterLinkStub).exists()).toBeFalsy();
  });
  it("renders loading state", () => {
    const wrapper = mount(Table, {
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
    expect(wrapper.findAll(".content-loader").length).toBe(22);
  });
  it("renders L1/L2 state properly", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: transaction,
        loading: false,
      },
    });
    const transferContainer = wrapper.find(".transfer-container");
    const networks = transferContainer.findAll(".transactions-data-link-network");
    expect(networks[0].text()).toBe("L2");
    expect(networks[1].text()).toBe("L2");
  });
  it("passes props to TransactionData component correctly", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          TransactionData,
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: transaction,
        loading: false,
        decodingDataError: "some error",
      },
    });
    const component = wrapper.findComponent(TransactionData);
    expect(component.props().data).toEqual(transaction.data);
    expect(component.props().loading).toEqual(false);
    expect(component.props().error).toEqual("some error");
  });
  it("renders block number as text when transaction is indexing", () => {
    const wrapper = mount(Table, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          Tooltip: { template: "<div><slot /></div>" },
        },
        plugins: [i18n, $testId],
      },
      props: {
        transaction: {
          ...transaction,
          status: "indexing",
        },
        loading: false,
      },
    });
    const rowArray = wrapper.findAll("tr");
    const block = rowArray[2].findAll("td");
    expect(block[1].find("span").text()).toBe("#1162235");
    expect(block[1].findComponent(RouterLinkStub).exists()).toBeFalsy();
  });
});
