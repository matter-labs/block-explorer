import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, waitFor } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

import SourceViewer, { ITEM_HEIGHT } from "@/components/debugger/SourceViewer.vue";

import enUS from "@/locales/en.json";

import type { ActiveStep, TraceStep } from "@/composables/useTrace";

describe("SourceViewer:", () => {
  const container = {
    scroll: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component", async () => {
    const { findByText, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source: ["Hello World"],
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });

    findByText("Hello World");

    unmount();
  });

  it("shows error if step has error", async () => {
    const { findByTestId, findByText, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source: ["Hello World"],
        errors: ["Error text"],
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });

    const line = await findByTestId("instruction-list-item");
    findByText("Error text");
    expect(line.classList.contains("has-error")).toEqual(true);

    unmount();
  });

  it("does not render empty lines", async () => {
    const { findAllByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source: ["Hello", "", "World"],
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    const collection = await findAllByTestId("instruction-list-item");
    expect(collection.length).toEqual(2);

    unmount();
  });

  it("groups functions by default", async () => {
    const { getByTestId, queryAllByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source: ["foo", ".func_begin", "Hello", "World", "!", ".func_end"],
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });

    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const collection = await queryAllByTestId("instruction-list-item");
    expect(collection.length).toEqual(0);

    getByTestId("instruction-list-item-expandable");

    unmount();
  });

  it("expands a function", async () => {
    const { getByText, findByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source: ["foo", ".func_begin", "Hello", "World", "!", ".func_end"],
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const li = await findByTestId("instruction-list-item-expandable");
    await fireEvent.click(li);

    getByText("foo");
    getByText(".func_begin");
    getByText("Hello");
    getByText("World");
    getByText("!");
    getByText(".func_end");

    unmount();
  });

  it("collapses a function", async () => {
    const { findByText, findByTestId, queryByText, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source: ["foo", ".func_begin", "Hello", "World", "!", ".func_end"],
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const li = await findByTestId("instruction-list-item-expandable");
    await fireEvent.click(li);

    await findByText(".func_begin");

    await fireEvent.click(li);

    await waitFor(() => expect(queryByText(".func_begin")).toEqual(null));

    unmount();
  });

  it("renders list with full height when expanded", async () => {
    const source = ["foo", ".func_begin", "Hello", "World", "!", ".func_end"];
    const { findByText, findByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source,
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const li = await findByTestId("instruction-list-item-expandable");
    await fireEvent.click(li);

    await findByText(".func_begin");

    const ul = await findByTestId("instruction-list");
    expect(ul.style.height).toEqual(source.length * ITEM_HEIGHT + "px");

    unmount();
  });

  it("renders list items that are in view port", async () => {
    const source = ["foo", ".func_begin", "Hello", "World", "!", ".func_end"];
    const { getByText, findAllByTestId, findByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source,
        container,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(50);

    const li = await findByTestId("instruction-list-item-expandable");
    await fireEvent.click(li);

    const collection = await findAllByTestId("instruction-list-item");
    expect(collection.length).toEqual(3);

    getByText("foo");
    getByText(".func_begin");
    getByText("Hello");
    getByText("World");

    unmount();
  });

  it("highlights active line", async () => {
    const source = ["foo", "Hello", "World", "!"];

    const { findAllByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source,
        container,
        activeStep: {
          address: "0x00",
          line: 2,
          step: {},
        },
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const collection = await findAllByTestId("instruction-list-item");
    expect(collection[2].classList.contains("highlighted")).toEqual(true);

    unmount();
  });

  it("scrolls to active line", async () => {
    const spy = vi.spyOn(container, "scroll").mockImplementation(() => {
      return undefined;
    });
    const source = ["foo", "Hello", "World", "!"];
    const wrapper = mount(SourceViewer, {
      props: {
        address: "0x01",
        source,
        container: container as unknown as HTMLElement,
        activeStep: { address: "0x00", line: 2, step: {} } as ActiveStep,
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });

    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(100);
    await wrapper.setProps({ activeStep: { address: "0x01", line: 3, step: {} as TraceStep } });
    wrapper.find("instruction-list-item");
    expect(spy).toHaveBeenCalledWith(0, -72);
    wrapper.unmount();
  });

  it("highlights search text", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const { findAllByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source,
        activeStep: {
          address: "0x00",
          line: 2,
          step: {},
        },
        container,
        searchText: "Wo",
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const collection = await findAllByTestId("instruction-list-item");
    expect(collection[0].innerHTML).toContain('<mark class="mark">Wo</mark>');

    unmount();
  });

  it("filters by search text", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const { findAllByTestId, unmount } = render(SourceViewer, {
      props: {
        address: "0x00",
        source,
        activeStep: {
          address: "0x00",
          line: 2,
          step: {},
        },
        container,
        searchText: "o",
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(1000);

    const collection = await findAllByTestId("instruction-list-item");
    expect(collection.length).toEqual(3);

    unmount();
  });
  it("adds executed class to active lines", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const wrapper = mount(SourceViewer, {
      props: {
        address: "0x01",
        source,
        container: container as unknown as HTMLElement,
        activeStep: { address: "0x00", line: 2, step: {} } as ActiveStep,
        activeLines: [1, 3],
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });

    await wrapper.vm.$nextTick();
    const lines = wrapper.findAll("li");
    expect(lines).toHaveLength(4);
    expect(wrapper.findAll(".executed")).toHaveLength(2);
    expect(lines[0].attributes().class).toBe("instruction-list-item");
    expect(lines[1].attributes().class).toBe("instruction-list-item executed");
    expect(lines[2].attributes().class).toBe("instruction-list-item");
    expect(lines[3].attributes().class).toBe("instruction-list-item executed");

    wrapper.unmount();
  });

  it("emits nav:navigateToLine event on active line click", async () => {
    const source = ["foo", "Hello", "World", "!"];
    const wrapper = mount(SourceViewer, {
      props: {
        address: "0x01",
        source,
        container: container as unknown as HTMLElement,
        activeStep: { address: "0x00", line: 2, step: {} } as ActiveStep,
        activeLines: [1],
        traceCountPercentage: {},
        pcLineMapping: {},
      },
      global: {
        plugins: [i18n],
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.findAll("li")[1].trigger("click");
    expect(wrapper.emitted()).toHaveProperty("nav:navigateToLine", [[{ line: 1, address: "0x01" }]]);
    wrapper.unmount();
  });
});
