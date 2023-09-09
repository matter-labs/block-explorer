import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, waitFor } from "@testing-library/vue";

import Navigation from "@/components/debugger/Navigation.vue";

import testId from "./../../e2e/testId.json";
import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";

describe("Navigation:", () => {
  const platform = vi.spyOn(window.navigator, "userAgent", "get");
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders 0 as an active step out of total by default", async () => {
    const { container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        total: 10,
      },
    });
    expect(container.querySelector<HTMLInputElement>(".active-index")?.value).toEqual("0");
    expect(container.querySelector(".total")?.textContent).toEqual("/ 10");

    unmount();
  });

  it("handles prop update", async () => {
    const { container, unmount, rerender } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await rerender({
      index: 4,
    });
    expect(container.querySelector<HTMLInputElement>(".active-index")?.value).toEqual("5");

    unmount();
  });

  it("triggers nav:goTo event when previous button clicked", async () => {
    const { emitted, getByTestId, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.click(getByTestId("previous-instruction-navigation-button"));

    expect(emitted()).toHaveProperty("nav:goTo", [[1]]);
    unmount();
  });

  it("opens metadata popup ", async () => {
    const { emitted, getByTestId, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });
    await fireEvent.click(getByTestId("show-instruction-metadata-button"));

    expect(emitted()).toHaveProperty("nav:metadata");
    unmount();
  });

  it("triggers nav:goTo event when next button clicked", async () => {
    const { emitted, getByTestId, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.click(getByTestId("next-instruction-navigation-button"));
    expect(emitted()).toHaveProperty("nav:goTo", [[3]]);
    unmount();
  });

  it("renders Cmd+K hotkey label for MacOs", () => {
    platform.mockReturnValue("Mac OS X");
    const { container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });
    expect(container.querySelector(".navigation-search-input-container")?.getAttribute("data-hotkey")).toBe("Cmd + K");
    unmount();
  });

  it("renders Ctrl+K combination for non-MacOs", () => {
    platform.mockReturnValue("Win");
    const { container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });
    expect(container.querySelector(".navigation-search-input-container")?.getAttribute("data-hotkey")).toBe("Ctrl + K");
    unmount();
  });

  it("renders searchText", async () => {
    const { getByTestId, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
        searchText: "Hello",
      },
    });

    expect(getByTestId<HTMLInputElement>(testId.traceSearchInput).value).toEqual("Hello");
    unmount();
  });

  it("triggers update:searchText event when search text changed", async () => {
    const { emitted, getByTestId, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.update(getByTestId(testId.traceSearchInput), "He");
    expect(emitted()).toHaveProperty("update:searchText", [["He"]]);
    unmount();
  });
  it("triggers nav:goTo event on active step input blur", async () => {
    const { emitted, container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "5");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    await waitFor(() => {
      expect(emitted()).toHaveProperty("nav:goTo", [[4]]);
    });
    unmount();
  });
  it("triggers nav:goTo event on active step form submit", async () => {
    const { emitted, container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "5");
    await fireEvent.submit(container.querySelector<HTMLFormElement>("form")!);
    await waitFor(() => {
      expect(emitted()).toHaveProperty("nav:goTo", [[4]]);
    });
    unmount();
  });
  it("triggers nav:goTo event with 0 value when active step input value is not a number", async () => {
    const { emitted, container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "123test");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    await waitFor(() => {
      expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    });
    unmount();
  });
  it("triggers nav:goTo event with 0 value when active step input value is greater than total", async () => {
    const { emitted, container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });
    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "52");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    await waitFor(() => {
      expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    });
    unmount();
  });
  it("triggers nav:goTo event when firstStep button clicked", async () => {
    const { emitted, container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });
    await fireEvent.click(container.querySelectorAll(".navigation-button")[0]);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
  it("triggers nav:goTo event when lastStep button clicked", async () => {
    const { container, unmount, emitted } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.click(container.querySelectorAll(".navigation-button")[3]);
    expect(emitted()).toHaveProperty("nav:goTo", [[9]]);
    unmount();
  });
  it("sets total length as a maxlength of active step input", async () => {
    const { container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 1234,
      },
    });
    expect(container.querySelector<HTMLInputElement>(".active-index")?.getAttribute("maxlength")).toBe("4");
    unmount();
  });
  it("doesn't allow to add more characters than total length in active step input", async () => {
    const { container, unmount, emitted } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 1234,
      },
    });
    expect(container.querySelector<HTMLInputElement>(".active-index")?.getAttribute("maxlength")).toBe("4");
    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "456456");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
  it("allows to add only numbers in active step input", async () => {
    const { container, unmount, emitted } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 1234,
      },
    });
    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "123f-as+45");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
  it("triggers nav:goTo event with 0 value when start button clicked", async () => {
    const { emitted, container, unmount } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 10,
      },
    });

    await fireEvent.click(container.querySelector(".start")!);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
  it("doesn't allow to add '.' in active step input", async () => {
    const { container, unmount, emitted } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 1234,
      },
    });
    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "12.4");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
  it("doesn't allow to add 'e' in active step input", async () => {
    const { container, unmount, emitted } = render(Navigation, {
      global: {
        plugins: [i18n, $testId],
      },
      props: {
        index: 2,
        total: 1234,
      },
    });
    await fireEvent.update(container.querySelector<HTMLInputElement>(".active-index")!, "12e");
    await fireEvent.blur(container.querySelector<HTMLInputElement>(".active-index")!);
    expect(emitted()).toHaveProperty("nav:goTo", [[0]]);
    unmount();
  });
});
