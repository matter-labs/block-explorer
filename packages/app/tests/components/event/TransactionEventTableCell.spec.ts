import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";
import { RouterLinkStub } from "@vue/test-utils";

import TransactionEventTableCell from "@/components/event/TransactionEventTableCell.vue";

import enUS from "@/locales/en.json";

const item = {
  address: "0x000000000000000000000000000000000000800a",
  blockHash: "0x58b1af00d17caee971b3d72fb95d769331105d1a54cae586b955639ce6419bc1",
  blockNumber: 12,
  l1BatchNumber: "0x91982",
  transactionHash: "0x7ca934c36aec488cdfacaf660a9257f471d5207a73467849f677e6d0502696e7",
  transactionIndex: "0x2",
  logIndex: "0x18",
  transactionLogIndex: "0x18",
  logType: null,
  removed: false,
  data: "0x0000000000000000000000000000000000000000000000000000000000000001",
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000006cc8cf7f6b488c58aa909b77e6e65c631c204784",
    "0x000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044",
  ],
};

describe("TransactionEventTableCell", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    stubs: {
      RouterLink: RouterLinkStub,
    },
    plugins: [i18n],
  };

  it("renders component properly", () => {
    const { container, getByText, unmount } = render(TransactionEventTableCell, {
      props: {
        item,
      },
      global,
    });
    expect(container.querySelector(".transaction-hash .only-desktop")?.textContent).toBe(
      "0x7ca934c36aec488cdfacaf660a9257f471d5207a73467849f677e6d0502696e7"
    );
    getByText("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    getByText("0x0000000000000000000000006cc8cf7f6b488c58aa909b77e6e65c631c204784");
    getByText("0x000000000000000000000000a1cf087db965ab02fb3cface1f5c63935815f044");
    expect(container.querySelector(".data-container span")?.childNodes[0].nodeValue).toBe("value: ");
    expect(container.querySelector(".expandable-text-content")?.textContent).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
    expect(container.querySelector(".expand-button")?.textContent).toBe("Show More");
    unmount();
  });
  it("opens dropdown up if the popoverPlacement is seted to 'top'", async () => {
    const { container, unmount } = render(TransactionEventTableCell, {
      props: {
        item,
        popoverPlacement: "top",
      },
      global,
    });

    await fireEvent.click(container.querySelector(".toggle-button")!);
    expect(container.querySelector(".opens-up")).toBeTruthy();

    unmount();
  });
});
