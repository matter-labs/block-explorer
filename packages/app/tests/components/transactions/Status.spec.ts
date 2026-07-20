import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import Badge from "@/components/common/Badge.vue";
import Spinner from "@/components/common/Spinner.vue";
import Status from "@/components/transactions/Status.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

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
      },
    });
    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(1);

    const [failedBadge] = badges;

    expect(failedBadge.props().color).toBe("danger");
    expect(failedBadge.text()).toBe(i18n.global.t("transactions.statusComponent.failed"));
  });
  it("shows execution completed badge and finality validating badge for 'included' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "included",
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

    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.execution"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.finality"));
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
  it("shows execution completed badge and finality validating badge for 'committed' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "committed",
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
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.execution"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.finality"));
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

    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.validating"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-neutral");
    spinnerComponents = l1StatusBadgeValueMobile.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
  });
  it("shows execution completed badge and finality validating badge for 'proved' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "proved",
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
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.execution"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.finality"));
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

    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.executing"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-neutral");
    spinnerComponents = l1StatusBadgeValueMobile.findAllComponents(Spinner);
    expect(spinnerComponents.length).toBe(1);
    expect(spinnerComponents[0].props().color).toBe("dark-neutral");
  });
  it("shows execution completed badge and finality executed badge for 'verified' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "verified",
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
    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.execution"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(l1StatusBadgeTitle.text()).toBe(i18n.global.t("general.finality"));
    expect(l1StatusBadgeTitle.props().color).toBe("success");
    expect(l1StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l1StatusBadgeValueDesktop.text()).toBe(
      i18n.global.t("transactions.statusComponent.sent") +
        i18n.global.t("transactions.statusComponent.validated") +
        i18n.global.t("transactions.statusComponent.executed")
    );
    expect(l1StatusBadgeValueDesktop.props().color).toBe("dark-success");
    expect(l1StatusBadgeValueMobile.text()).toBe(i18n.global.t("transactions.statusComponent.executed"));
    expect(l1StatusBadgeValueMobile.props().color).toBe("dark-success");
  });
  it("shows indexing badge for 'indexing' status", async () => {
    const wrapper = mount(Status, {
      global,
      props: {
        status: "indexing",
      },
    });

    const badges = wrapper.findAllComponents(Badge);
    expect(badges.length).toBe(3);

    const [l2StatusBadgeTitle, l2StatusBadgeValue, indexingBadge] = badges;

    expect(l2StatusBadgeTitle.text()).toBe(i18n.global.t("general.execution"));
    expect(l2StatusBadgeTitle.props().color).toBe("success");
    expect(l2StatusBadgeTitle.props().textColor).toBe("neutral");

    expect(l2StatusBadgeValue.text()).toBe(i18n.global.t("transactions.statusComponent.processed"));
    expect(l2StatusBadgeValue.props().color).toBe("dark-success");

    expect(indexingBadge.props().color).toBe("neutral");
    expect(indexingBadge.text()).toBe(i18n.global.t("transactions.statusComponent.indexing"));
  });
});
