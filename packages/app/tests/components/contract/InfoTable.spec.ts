import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import InfoTable from "@/components/contract/InfoTable.vue";

import enUS from "@/locales/en.json";

import type { Contract } from "@/composables/useAddress";

describe("InfoTable", () => {
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
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        contract: {
          type: "contract",
          address: "0xc2675AE7F35b7d85Ed1E828CCf6D0376B01ADea3",
          creatorAddress: "0x06590AD9b721DD3d4fd2177d643799E552437904",
          creatorTxHash: "0xc3751ea2572cb6b4f061af1127a67eaded2cfc191f2a18d69000bbe2e98b680a",
          totalTransactions: 31231,
          balances: {},
          verificationInfo: null,
        } as Contract,
        loading: false,
      },
    });
    const rowArray = wrapper.findAll("tr");
    const address = rowArray[0].findAll("td");
    expect(address[0].text()).toBe("Address");
    expect(address[1].text()).toBe("0xc2675AE7F35b7d85Ed1E828CCf6D0376B01ADea3");

    const creator = rowArray[1].findAll("td");
    expect(creator[0].text()).toBe("Creator");
    const [creatorAddressLink, creatorTxHash] = creator[1].findAllComponents(RouterLinkStub);
    expect(creatorAddressLink).toBeTruthy();
    expect(creatorTxHash).toBeTruthy();
    expect(creatorAddressLink.props().to.name).toBe("address");
    expect(creatorAddressLink.props().to.params.address).toBe("0x06590AD9b721DD3d4fd2177d643799E552437904");
    expect(creatorTxHash.props().to.name).toBe("transaction");
    expect(creatorTxHash.props().to.params.hash).toBe(
      "0xc3751ea2572cb6b4f061af1127a67eaded2cfc191f2a18d69000bbe2e98b680a"
    );

    const transactions = rowArray[2].findAll("td");
    expect(transactions[0].text()).toBe("Transactions");
    expect(transactions[1].text()).toBe("31231");
  });
  it("renders loading state", () => {
    const wrapper = mount(InfoTable, {
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        loading: true,
      },
    });
    expect(wrapper.findAll(".content-loader").length).toBe(6);
  });
});
