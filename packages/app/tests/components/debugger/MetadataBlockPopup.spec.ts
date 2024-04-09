import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/vue";

import MetadataBlockPopup from "@/components/debugger/MetadataBlockPopup.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

class IntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

const router = {
  replace: vi.fn(),
  currentRoute: {
    value: {},
  },
};

vi.mock("vue-router", () => ({
  useRouter: () => router,
  useRoute: () => vi.fn(),
}));

const step = {
  contract_address: "0xdeadbeef00000000000000000000000000000000",
  registers: ["0x0", "0x4", "0x0", "0xffffff", "0x0"],
  pc: 1,
  sp: 0,
  set_flags: ["eq"],
  skip_cycle: false,
  code_page_index: 4,
  heap_page_index: 5,
  stack_page_index: 12,
  calldata_page_index: 3,
  returndata_page_index: 0,
  register_interactions: { "1": "Write", "4": "Read" },
  memory_interactions: [
    {
      memory_type: "heap",
      page: 5,
      address: 524286,
      value: "0000000000000000000000000000000000000000000000000000000000000000",
      direction: "Read",
    },
    {
      memory_type: "heap",
      page: 5,
      address: 524286,
      value: "0000000000000000000000000000000000000000000000000000000000000004",
      direction: "Write",
    },
  ],
  memory_snapshots: [],
  error: null,
};

const file = {
  sources: {
    "0x00": {
      assembly_code: `\t.text\t.file\t"HelloWorld.sol"Hello\nWorld`,
      active_lines: [],
      pc_line_mapping: {},
    },
  },
  steps: [],
};

describe("MetadataBlockPopup:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  beforeEach(() => {
    const el = document.createElement("div");
    el.id = "modal";
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.outerHTML = "";
  });

  it("renders component", () => {
    const source = ["foo", "Hello", "World", "!"];
    const { container } = render(MetadataBlockPopup, {
      props: {
        address: "0x00",
        source,
        opened: true,
        activeStep: {
          address: "0x00",
          line: 2,
          step,
        },
        index: 2,
        total: 4,
        file,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          teleport: true,
        },
      },
    });

    expect(container.querySelector(".metadata-popup-active-code")!.textContent).toBe("3 World");
    const rows = container.querySelectorAll(".meta-info");
    expect(rows[0].querySelector(".actual-string")!.textContent).toBe("0xdeadbeef00000000000000000000000000000000");
    const flags = rows[1].querySelectorAll(".badge-container");
    expect(flags[0].className).contain("color-danger");
    expect(flags[1].className).contain("color-progress");
    expect(flags[2].className).contain("color-danger");
    const registersContainer = rows[2].querySelectorAll(".badge-wrap");
    const registers = registersContainer[0].querySelectorAll(".badge-container");

    expect(registers[0].querySelector(".badge-content")!.textContent).toBe("0x0");
    expect(registers[1].querySelector(".badge-content")!.textContent).toBe("0x4");
    expect(registers[2].querySelector(".badge-content")!.textContent).toBe("0x0");
    expect(registers[3].querySelector(".badge-content")!.textContent).toBe("0xffffff");
    const memoryContainer = rows[3].querySelectorAll(".badge-wrap");

    const memory = memoryContainer[0].querySelectorAll(".badge-content");
    expect(memory[0]!.textContent).toBe("0000000000000000000000000000000000000000000000000000000000000000");
    expect(memory[1]!.textContent).toBe("0000000000000000000000000000000000000000000000000000000000000004");

    const memoryIndexesContainer = container.querySelector(".page-index-container");

    const memoryIndexes = memoryIndexesContainer!.querySelectorAll(".page-index");

    expect(memoryIndexes[1].textContent).toBe("5");
    expect(memoryIndexes[0].textContent).toBe("12");
    expect(memoryIndexes[2].textContent).toBe("4");
    expect(memoryIndexes[3].textContent).toBe("3");
    expect(memoryIndexes[4]).toBe(undefined);

    const memoryTabs = container.querySelectorAll(".tab-btn");
    expect(memoryTabs[0].textContent).toBe("stack 12");
    expect(memoryTabs[1].textContent).toBe("heap 5");
    expect(memoryTabs[2].textContent).toBe("code 4");
    expect(memoryTabs[3].textContent).toBe("calldata 3");
    expect(memoryTabs[4]).toBe(undefined);
  });

  it("triggers nav:goTo event when next button clicked", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const { emitted, unmount, getByTestId } = render(MetadataBlockPopup, {
      props: {
        address: "0x00",
        source,
        opened: true,
        activeStep: {
          address: "0x00",
          line: 2,
          step,
        },
        index: 2,
        total: 4,
        file,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          teleport: true,
        },
      },
    });
    await fireEvent.click(getByTestId("next-instruction-navigation-button"));
    expect(emitted()).toHaveProperty("nav:goTo", [[3]]);
    unmount();
  });
  it("triggers nav:goTo event when previous button clicked", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const { emitted, unmount, getByTestId } = render(MetadataBlockPopup, {
      props: {
        address: "0x00",
        source,
        opened: true,
        activeStep: {
          address: "0x00",
          line: 2,
          step,
        },
        index: 2,
        total: 4,
        file,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          teleport: true,
        },
      },
    });
    await fireEvent.click(getByTestId("previous-instruction-navigation-button"));
    expect(emitted()).toHaveProperty("nav:goTo", [[1]]);
    unmount();
  });
  it("triggers nav:goTo event when firstStep button clicked", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const { emitted, unmount, container } = render(MetadataBlockPopup, {
      props: {
        address: "0x00",
        source,
        opened: true,
        activeStep: {
          address: "0x00",
          line: 2,
          step,
        },
        index: 2,
        total: 4,
        file,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          teleport: true,
        },
      },
    });
    await fireEvent.click(container.querySelectorAll(".navigation-button")[0]);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
  it("triggers nav:goTo event when lastStep button clicked", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const { emitted, unmount, container } = render(MetadataBlockPopup, {
      props: {
        address: "0x00",
        source,
        opened: true,
        activeStep: {
          address: "0x00",
          line: 2,
          step,
        },
        index: 2,
        total: 4,
        file,
      },
      global: {
        plugins: [i18n, $testId],
        stubs: {
          teleport: true,
        },
      },
    });
    await fireEvent.click(container.querySelectorAll(".navigation-button")[3]);
    expect(emitted()).toHaveProperty("nav:goTo", [[3]]);
    unmount();
  });
});
