import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import { useContractEventsMock } from "../../mocks";

import ContractEvents from "@/components/event/ContractEvents.vue";

import enUS from "@/locales/en.json";

import type { Contract } from "@/composables/useAddress";

const contractEvent = {
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

describe("ContractEvents", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  const props = {
    contract: {
      address: "0xccecabef8567654498c41f67c2d6bf232360e92d",
    } as Contract,
  };

  const global = {
    stubs: {
      RouterLink: RouterLinkStub,
    },
    plugins: [i18n],
  };

  it("renders header properly", () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      total: 1,
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });

    expect(container.querySelectorAll(".table-head-col")).toHaveLength(3);
    expect(container.querySelectorAll(".table-head-col")[0].textContent).toBe("txn hash");
    expect(container.querySelectorAll(".table-head-col")[1].textContent).toBe("method");
    expect(container.querySelectorAll(".table-head-col")[2].textContent).toBe("logs");

    mockContractEvents.mockRestore();
    unmount();
  });

  it("renders table row data based on input", () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      total: 1,
    });

    const { container, getByText, unmount } = render(ContractEvents, {
      props,
      global,
    });

    expect(container.querySelector(".first-col .hash-label-component")?.textContent).toBe(
      "0x7ca934c36aec488cdfacaf660a9257f471d5207a73467849f677e6d0502696e7"
    );
    expect(container.querySelector(".first-col > span")?.textContent).toBe(" #12");
    getByText("Transfer");
    expect(container.querySelector(".last-col .hash-label-component")?.textContent).toBe(
      "0x7ca934c36aec488cdfacaf660a9257f471d5207a73467849f677e6d0502696e7"
    );
    expect(container.querySelector(".topic-index-container")?.textContent).toBe("0");
    expect(container.querySelector(".topic-value")?.textContent).toBe(
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    );
    getByText("0x6cC8cf7f6b488C58AA909B77E6e65c631c204784");
    expect(container.querySelector(".data-container span")?.childNodes[0].nodeValue).toBe("value: ");
    expect(container.querySelector(".expandable-text-content")?.textContent).toBe("1");
    expect(container.querySelector(".expand-button")?.textContent).toBe("Show More");

    mockContractEvents.mockRestore();
    unmount();
  });

  it("renders loading state when isRequestPending is true", () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      isRequestPending: ref(true),
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });
    expect(container.querySelectorAll(".content-loader")).toHaveLength(8);

    mockContractEvents.mockRestore();
    unmount();
  });

  it("renders empty state when there is no events for the contract", () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([]),
      total: 0,
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });

    expect(container.querySelectorAll(".table-head-col")).toHaveLength(0);
    expect(container.querySelector(".empty-state")?.textContent).toBe(
      "Smart Contract doesn't have any events at this moment"
    );

    mockContractEvents.mockRestore();
    unmount();
  });

  it("renders 'Hide' button on 'Show More' button click", async () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      total: 1,
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });

    expect(container.querySelector(".expand-button")?.textContent).toBe("Show More");
    await fireEvent.click(container.querySelector(".expand-button")!);
    expect(container.querySelector(".expand-button")?.textContent).toBe("Hide");

    mockContractEvents.mockRestore();
    unmount();
  });

  it("renders 'Show More' button on 'Hide' button click", async () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      total: 1,
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });

    await fireEvent.click(container.querySelector(".expand-button")!);
    expect(container.querySelector(".expand-button")?.textContent).toBe("Hide");

    await fireEvent.click(container.querySelector(".expand-button")!);
    expect(container.querySelector(".expand-button")?.textContent).toBe("Show More");

    mockContractEvents.mockRestore();
    unmount();
  });

  it("renders links properly", async () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      total: 1,
    });

    const wrapper = mount(ContractEvents, {
      props,
      global,
    });

    const routerLinks = wrapper.findAllComponents(RouterLinkStub);

    expect(routerLinks).toHaveLength(5);

    expect(routerLinks[0].props().to.name).toBe("transaction");
    expect(routerLinks[0].props().to.params.hash).toBe(
      "0x7ca934c36aec488cdfacaf660a9257f471d5207a73467849f677e6d0502696e7"
    );

    expect(routerLinks[1].props().to.name).toBe("block");
    expect(routerLinks[1].props().to.params.id).toBe(12);

    expect(routerLinks[2].props().to.name).toBe("transaction");
    expect(routerLinks[2].props().to.params.hash).toBe(
      "0x7ca934c36aec488cdfacaf660a9257f471d5207a73467849f677e6d0502696e7"
    );

    expect(routerLinks[3].props().to.name).toBe("address");
    expect(routerLinks[3].props().to.params.address).toBe("0x6cC8cf7f6b488C58AA909B77E6e65c631c204784");

    expect(routerLinks[4].props().to.name).toBe("address");
    expect(routerLinks[4].props().to.params.address).toBe("0xa1cf087DB965Ab02Fb3CFaCe1f5c63935815f044");

    mockContractEvents.mockRestore();
  });

  it("shows 'Hex' type by default if SC is not verified", () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([{ ...contractEvent, event: undefined }]),
      total: 1,
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });

    expect(container.querySelectorAll(".selected-option")).toHaveLength(3);
    expect(container.querySelectorAll(".selected-option")[0].textContent).toBe("Hex");
    expect(container.querySelectorAll(".selected-option")[1].textContent).toBe("Hex");
    expect(container.querySelectorAll(".selected-option")[2].textContent).toBe("Hex");

    mockContractEvents.mockRestore();
    unmount();
  });

  it("shows filtered types if SC is verified", () => {
    const mockContractEvents = useContractEventsMock({
      collection: ref([contractEvent]),
      total: 1,
    });

    const { container, unmount } = render(ContractEvents, {
      props,
      global,
    });

    expect(container.querySelectorAll(".selected-option")).toHaveLength(3);
    expect(container.querySelectorAll(".selected-option")[0].textContent).toBe("Address");
    expect(container.querySelectorAll(".selected-option")[1].textContent).toBe("Address");
    expect(container.querySelectorAll(".selected-option")[2].textContent).toBe("Number");

    mockContractEvents.mockRestore();
    unmount();
  });
});
