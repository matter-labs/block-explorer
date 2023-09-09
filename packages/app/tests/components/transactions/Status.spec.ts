import { describe, expect, it } from "vitest";

import { createI18n } from "vue-i18n";

import { mount } from "@vue/test-utils";

import Badge from "@/components/common/Badge.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import Spinner from "@/components/common/Spinner.vue";
import Status from "@/components/transactions/Status.vue";

import useContext from "@/composables/useContext";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

const { currentNetwork } = useContext();

describe("Status", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    stubs: {
      Badge,
    },
    plugins: [i18n, $testId],
  };
  it("shows a single danger badge with an error icon for 'failed' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "failed",
        commitTxHash: "commitTxHash",
        proveTxHash: "proveTxHash",
        executeTxHash: "executeTxHash",
      },
    });
    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(1);

    const [failedBadge] = badges;

    expect(failedBadge.props().color).toBe("danger");
    expect(failedBadge.text()).toBe(i18n.global.t("transactions.statusComponent.failed"));
  });
  it("shows l2 completed badge and l1 validating badge for 'included' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "included",
        commitTxHash: "commitTxHash",
        proveTxHash: "proveTxHash",
        executeTxHash: "executeTxHash",
      },
    });
    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(5);

    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;

    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeTitle.props().color).toBe("neutral");
    expect(l1StatusBadgeTitle.props().textColor).toBe("neutral");
    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sending") +
        i18n.global.t("transactions.statusComponent.validating") +
        i18n.global.t("transactions.statusComponent.executing")
    );
    expect(l1StatusBadgeValueDesktop.props().color).toBe("dark-neutral");
    let spinnerComponents = l1StatusBadgeValueDesktop.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");

    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.sending"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-neutral");
    spinnerComponents = l1StatusBadgeValueMobile.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
  });
  it("shows l2 completed badge and l1 validating badge for 'committed' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "committed",
        commitTxHash: "commitTxHash",
        proveTxHash: "proveTxHash",
        executeTxHash: "executeTxHash",
      },
    });
    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(5);

    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeTitle.props().color).toBe("neutral");
    expect(l1StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validating") +
        i18n.global.t("transactions.statusComponent.executing")
    );
    expect(l1StatusBadgeValueDesktop.props().color).toBe("dark-neutral");
    let spinnerComponents = l1StatusBadgeValueDesktop.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
    const l1StatusLinks = l1StatusBadgeValueDesktop.findAll(".badge-pre-content a");
    const [sentLink] = l1StatusLinks;
    expect(sentLink.attributes("href")).toBe(
      `${currentNetwork.value.l1ExplorerUrl}/tx/${wrapper.props().commitTxHash}`
    );

    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.validating"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-neutral");
    spinnerComponents = l1StatusBadgeValueMobile.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
  });
  it("shows l2 completed badge and l1 validating badge for 'proved' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "proved",
        commitTxHash: "commitTxHash",
        proveTxHash: "proveTxHash",
        executeTxHash: "executeTxHash",
      },
    });
    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(5);

    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeTitle.props().color).toBe("neutral");
    expect(l1StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validated") +
        i18n.global.t("transactions.statusComponent.executing")
    );
    expect(l1StatusBadgeValueDesktop.props().color).toBe("dark-neutral");
    let spinnerComponents = l1StatusBadgeValueDesktop.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
    const l1StatusLinks = l1StatusBadgeValueDesktop.findAll(".badge-pre-content a");
    const [sentLink, validatedLink] = l1StatusLinks;
    expect(sentLink.attributes("href")).toBe(
      `${currentNetwork.value.l1ExplorerUrl}/tx/${wrapper.props().commitTxHash}`
    );
    expect(validatedLink.attributes("href")).toBe(
      `${currentNetwork.value.l1ExplorerUrl}/tx/${wrapper.props().proveTxHash}`
    );

    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.executing"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-neutral");
    spinnerComponents = l1StatusBadgeValueMobile.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
  });
  it("shows l2 completed badge and l1 executed badge for 'verified' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "verified",
        commitTxHash: "commitTxHash",
        proveTxHash: "proveTxHash",
        executeTxHash: "executeTxHash",
      },
    });
    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(5);

    const [
      l2StatusBadgeTitle,
      l2StatusBadgeValue,
      l1StatusBadgeTitle,
      l1StatusBadgeValueDesktop,
      l1StatusBadgeValueMobile,
    ] = badges;
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.l2NetworkName"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.l1NetworkName"));
    expect(l1StatusBadgeTitle.props().color).toBe("success");
    expect(l1StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validated") +
        i18n.global.t("transactions.statusComponent.executed")
    );
    expect(l1StatusBadgeValueDesktop.props().color).toBe("dark-success");
    const l1StatusLinks = l1StatusBadgeValueDesktop.findAll(".badge-pre-content a");
    const [sentLink, validatedLink] = l1StatusLinks;
    expect(sentLink.attributes("href")).toBe(
      `${currentNetwork.value.l1ExplorerUrl}/tx/${wrapper.props().commitTxHash}`
    );
    expect(validatedLink.attributes("href")).toBe(
      `${currentNetwork.value.l1ExplorerUrl}/tx/${wrapper.props().proveTxHash}`
    );

    const l1ExecutedLink = l1StatusBadgeValueDesktop.find(".badge-content a");
    expect(l1ExecutedLink.attributes("href")).toBe(
      `${currentNetwork.value.l1ExplorerUrl}/tx/${wrapper.props().executeTxHash}`
    );

    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.executed"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-success");
  });
  it("shows icon tooltip and single indexing badge for 'indexing' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "indexing",
        commitTxHash: "commitTxHash",
        proveTxHash: "proveTxHash",
        executeTxHash: "executeTxHash",
      },
    });

    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(1);

    const [indexingBadge] = badges;

    expect(indexingBadge.props().color).toBe("neutral");
    expect(indexingBadge.text()).toBe(i18n.global.t("transactions.statusComponent.indexing"));

    const infoTooltip = wrapper.findAllComponents(InfoTooltip);
    expect(infoTooltip.length).toBe(1);
    expect(infoTooltip[0].text()).toBe(i18n.global.t("transactions.statusComponent.indexingTooltip"));
  });
});
