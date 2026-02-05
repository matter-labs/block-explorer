import { computed, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, waitFor } from "@testing-library/vue";

import * as useTrace from "@/composables/useTrace";

import testId from "./../e2e/testId.json";
import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import DebuggerView from "@/views/DebuggerView.vue";

describe("DebuggerView:", () => {
  const file = ref({
    sources: {
      "0x00": {
        assembly_code: `\t.text\t.file\t"HelloWorld.sol"Hello\nWorld`,
        active_lines: [],
        pc_line_mapping: {},
      },
    },
    steps: [
      {
        calldata_page_index: 10,
        returndata_page_index: 5,
        code_page_index: 0,
        contract_address: "0x00",
        error: null,
        heap_page_index: 0,
        memory_interactions: [],
        memory_snapshots: [],
        pc: 0,
        register_interactions: {},
        registers: ["0x24000000000000000300000000"],
        set_flags: [],
        skip_cycle: false,
        sp: 0,
        stack_page_index: 0,
      },
      {
        calldata_page_index: 10,
        returndata_page_index: 5,
        code_page_index: 0,
        contract_address: "0x01",
        error: null,
        heap_page_index: 0,
        memory_interactions: [],
        memory_snapshots: [],
        pc: 0,
        register_interactions: {},
        registers: ["0x24000000000000000300000000"],
        set_flags: [],
        skip_cycle: false,
        sp: 0,
        stack_page_index: 0,
      },
    ],
  });

  const platform = vi.spyOn(window.navigator, "userAgent", "get");
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  vi.mock("vue-router", () => ({
    useRouter: () => vi.fn(),
    useRoute: () => vi.fn(),
    createWebHistory: () => vi.fn(),
    createRouter: () => ({ beforeEach: vi.fn() }),
  }));

  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "debugger")?.meta?.title as string)).toBe("zkEVM Debugger");
  });

  it("renders empty state when trace is empty", () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => null),
      hasError: computed(() => false),
    });
    const { getByText, container, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    getByText(enUS.debuggerTool.title);
    getByText(enUS.debuggerTool.whatFor);
    expect(container.querySelector(".upload-file")).not.toBeNull();

    mockTrace.mockRestore();
    unmount();
  });

  it("renders empty state with an error when hasError is true", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => null),
      hasError: computed(() => true),
    });
    const { getByText, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await waitFor(() => getByText(enUS.debuggerTool.unableToParseTrace));

    mockTrace.mockRestore();
    unmount();
  });

  it("renders source list collection", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });

    const { getByText, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await waitFor(() => getByText("0x00"));
    mockTrace.mockRestore();
    unmount();
  });

  it("renders fileName when available", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: `\t.text\t.file\t"HelloWorld.sol"Hello\nWorld`,
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });

    const { getByText, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await waitFor(() => getByText("HelloWorld.sol"));
    mockTrace.mockRestore();
    unmount();
  });

  it("expands a node when click on label", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });

    const { getByTestId, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.click(getByTestId("file-list-item-toggle"));

    await waitFor(() => getByTestId("instruction-list"));
    mockTrace.mockRestore();
    unmount();
  });

  it("expands a node when enter pressed", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });

    const { getByTestId, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.keyPress(getByTestId("file-list-item-toggle"), { key: "Enter" });

    await waitFor(() => getByTestId("instruction-list"));
    mockTrace.mockRestore();
    unmount();
  });

  it("does not expand a node when click on label when search active", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });

    const { getByTestId, unmount, queryAllByTestId } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.update(getByTestId(testId.traceSearchInput), "k");
    await fireEvent.click(getByTestId("file-list-item-toggle"));

    await waitFor(() => getByTestId("instruction-list"));
    expect(queryAllByTestId("instruction-list-item").length).toEqual(0);
    mockTrace.mockRestore();
    unmount();
  });

  it("opens full screen mode on 'full screen' icon click", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });
    const { container, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.click(container.querySelector(".full-screen-container > button")!);

    const element = container.querySelector(".debugger")!;
    expect(element.classList.contains("debugger-full-screen")).toEqual(true);

    mockTrace.mockRestore();
    unmount();
  });

  it("renders Cmd+S hotkey label for MacOs", () => {
    platform.mockReturnValue("Mac OS X");
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });
    const { container, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    expect(container.querySelector(".full-screen-container > span")!.textContent).toBe("Cmd + S");

    mockTrace.mockRestore();
    unmount();
  });

  it("renders Cmd+S hotkey label for non MacOs", () => {
    platform.mockReturnValue("Win");
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });
    const { container, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    expect(container.querySelector(".full-screen-container > span")!.textContent).toBe("Ctrl + S");

    mockTrace.mockRestore();
    unmount();
  });

  it("does not show expand icon when search is active", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => ({
        sources: {
          "0x00": {
            assembly_code: "Hello\nWorld",
            active_lines: [],
            pc_line_mapping: {},
          },
        },
        steps: [],
      })),
      hasError: computed(() => false),
    });

    const { getByTestId, unmount, container } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.update(getByTestId(testId.traceSearchInput), "He");

    expect(container.querySelectorAll(".toggle-button").length).toEqual(1);
    mockTrace.mockRestore();
    unmount();
  });

  it("resets searchText when file reuploaded", async () => {
    const file = ref({
      sources: {
        "0x00": {
          assembly_code: `\t.text\t.file\t"HelloWorld.sol"Hello\nWorld`,
          active_lines: [],
          pc_line_mapping: {},
        },
      },
      steps: [],
    });
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => file.value),
      hasError: computed(() => false),
    });

    const { container, unmount } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.update(container.querySelector(".navigation-search-input")!, "He");

    file.value = {
      sources: {
        "0x00": {
          assembly_code: `\t.text\t.file\t"ByeWorld.sol"Bye\nWorld`,
          active_lines: [],
          pc_line_mapping: {},
        },
      },
      steps: [],
    };

    const input = await waitFor(() => container.querySelector<HTMLInputElement>(".navigation-search-input"));

    expect(input?.value).toEqual("");

    mockTrace.mockRestore();
    unmount();
  });
  it("shows child metadata block if exist", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => file.value),
      hasError: computed(() => false),
    });
    const mockNavigation = vi.spyOn(useTrace, "useTraceNavigation").mockReturnValue({
      activeLines: ref({}),
      getActiveLines: () => {
        return null;
      },
      navigateToLine: () => {
        return null;
      },
      goTo: () => void {},
      activeStep: computed(() => {
        return {
          step: file.value.steps[0],
          address: "0x00",
        };
      }),
      index: ref(0),
      total: computed(() => 2),
      traceCountPercentage: computed(() => ({})),
    });
    const { unmount, container } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          MetadataBlock: {
            template: `<div>Metadata Block</div>`,
          },
          MetadataTabs: {
            template: `<div>Metadata Tabs</div>`,
          },
        },
      },
    });
    await nextTick();
    expect(container.querySelector(".parent-child-address .actual-string")?.textContent).toBe("0x01");
    expect(container.querySelector(".parent-child-type")?.textContent).toBe("Child");

    mockNavigation.mockRestore();
    mockTrace.mockRestore();
    unmount();
  });
  it("shows parent metadata block if exist", async () => {
    const mockTrace = vi.spyOn(useTrace, "default").mockReturnValue({
      upload: async () => null,
      file: computed(() => file.value),
      hasError: computed(() => false),
    });
    const mockNavigation = vi.spyOn(useTrace, "useTraceNavigation").mockReturnValue({
      activeLines: ref({}),
      getActiveLines: () => {
        return null;
      },
      navigateToLine: () => {
        return null;
      },
      goTo: () => void {},
      activeStep: computed(() => {
        return {
          step: file.value.steps[1],
          address: "0x00",
        };
      }),
      index: ref(1),
      total: computed(() => 2),
      traceCountPercentage: computed(() => ({})),
    });
    const { unmount, container } = render(DebuggerView, {
      global: {
        plugins: [i18n, $testId],
        stubs: {
          MetadataBlock: {
            template: `<div>Metadata Block</div>`,
          },
          MetadataTabs: {
            template: `<div>Metadata Tabs</div>`,
          },
        },
      },
    });
    await nextTick();
    expect(container.querySelector(".parent-child-address .actual-string")?.textContent).toBe("0x00");
    expect(container.querySelector(".parent-child-type")?.textContent).toBe("Parent");

    mockNavigation.mockRestore();
    mockTrace.mockRestore();
    unmount();
  });
});
