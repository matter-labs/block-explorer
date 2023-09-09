import { nextTick } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";

import MetadataBlock from "@/components/debugger/MetadataBlock.vue";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

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

const metadata = {
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
      memory_type: "stack",
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

describe("MetadataBlock:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component properly", async () => {
    const { container } = render(MetadataBlock, {
      props: {
        metadata,
        file,
      },
      global: {
        plugins: [i18n, $testId],
      },
    });

    await nextTick();
    const rows = container.querySelectorAll(".meta-info");
    expect(rows[0].querySelector(".displayed-string")!.textContent).toBe("0xdeadbeef000...0000000000000");
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
  it("renders only existing indexes", async () => {
    const { container } = render(MetadataBlock, {
      props: {
        metadata: {
          ...metadata,
          calldata_page_index: undefined,
          returndata_page_index: undefined,
        },
        file,
      },
      global: {
        plugins: [i18n, $testId],
      },
    });

    await nextTick();
    const memoryIndexesContainer = container.querySelector(".page-index-container");
    const memoryIndexes = memoryIndexesContainer!.querySelectorAll(".page-index");
    const memoryTabs = container.querySelectorAll(".tab-btn");
    expect(memoryIndexes).toHaveLength(3);
    expect(memoryIndexes[1].textContent).toBe("5");
    expect(memoryIndexes[0].textContent).toBe("12");
    expect(memoryIndexes[2].textContent).toBe("4");

    expect(memoryIndexes).toHaveLength(3);
    expect(memoryTabs[0].textContent).toBe("stack 12");
    expect(memoryTabs[1].textContent).toBe("heap 5");
    expect(memoryTabs[2].textContent).toBe("code 4");
  });
});
