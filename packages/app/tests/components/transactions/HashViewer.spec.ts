import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";

import HashViewer from "@/components/transactions/infoTable/HashViewer.vue";

import enUS from "@/locales/en.json";

describe("ConvertHashDropdown", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders component", () => {
    const { container } = render(HashViewer, {
      props: {
        hash: "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(container.querySelector(".data-value")?.textContent).toBe(
      "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403"
    );
  });
  it("adds opens-up class when popoverPlacement is setted to 'top'", async () => {
    const { container, unmount } = render(HashViewer, {
      global: {
        plugins: [i18n],
      },
      props: {
        hash: "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403",
        popoverPlacement: "top",
      },
    });

    await fireEvent.click(container.querySelector(".toggle-button")!);
    expect(container.querySelector(".option-list.opens-up")).toBeTruthy();
    unmount();
  });
  it("converts hash to number", async () => {
    const { container, getByText, unmount } = render(HashViewer, {
      props: {
        hash: "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".data-value")?.textContent).toBe(
      "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403"
    );
    await fireEvent.click(container.querySelector(".toggle-button")!);
    await fireEvent.click(getByText("Number"));
    expect(container.querySelector(".data-value")?.textContent).toBe(
      "402585566167427292863253751803857345753774113795"
    );
    unmount();
  });
  it("converts hash to address", async () => {
    const { container, getByText, unmount } = render(HashViewer, {
      props: {
        hash: "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".data-value")?.textContent).toBe(
      "0x00000000000000000000000046848fa6e189b5e94c7b71566b3617e30a714403"
    );
    await fireEvent.click(container.querySelector(".toggle-button")!);
    await fireEvent.click(getByText("Address"));
    expect(container.querySelector(".data-value")?.textContent).toBe("0x46848fa6e189b5e94c7b71566b3617e30a714403");
    unmount();
  });
  it("converts hash to text", async () => {
    const { container, getByText, unmount } = render(HashViewer, {
      props: {
        hash: "a18523b75fc9d74658d70c6a2ab6ea27d6bb2fb01a2ca9ea36cc8fc4708dcf3e",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".data-value")?.textContent).toBe(
      "a18523b75fc9d74658d70c6a2ab6ea27d6bb2fb01a2ca9ea36cc8fc4708dcf3e"
    );
    await fireEvent.click(container.querySelector(".toggle-button")!);
    await fireEvent.click(getByText("Text"));
    expect(container.querySelector(".data-value")?.textContent).toBe("¡#·_É×FX×\fj*¶ê'Ö»/°,©ê6ÌÄpÏ>");
    await fireEvent.click(container.querySelector(".toggle-button")!);
    const selected = container.querySelector("[aria-selected='true']")!;
    expect(selected.textContent).toBe("Text ");
    expect(selected.querySelector(".check-icon")).not.toBe(null);
    unmount();
  });
  it("uses defaultType", async () => {
    const { container } = render(HashViewer, {
      props: {
        hash: "a18523b75fc9d74658d70c6a2ab6ea27d6bb2fb01a2ca9ea36cc8fc4708dcf3e",
        defaultType: "text",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".data-value")?.textContent).toBe("¡#·_É×FX×\fj*¶ê'Ö»/°,©ê6ÌÄpÏ>");
  });
  it("converts hash to number when the hash is not a valid argument for BigInt", async () => {
    const { container, getByText } = render(HashViewer, {
      props: {
        hash: "0x",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".data-value")?.textContent).toBe("0x");
    await fireEvent.click(container.querySelector(".toggle-button")!);
    await fireEvent.click(getByText("Number"));
    expect(container.querySelector(".data-value")?.textContent).toBe("0");
  });
  it("converts hash to address when the hash is not a valid argument for BigInt", async () => {
    const { container, getByText, unmount } = render(HashViewer, {
      props: {
        hash: "0x",
      },
      slots: {
        default: `
        <template #scoped="params">
          <div class="data-value">
            {{ params.data }}
          </div>
        </template>
      `,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".data-value")?.textContent).toBe("0x");
    await fireEvent.click(container.querySelector(".toggle-button")!);
    await fireEvent.click(getByText("Address"));
    expect(container.querySelector(".data-value")?.textContent).toBe("0x0");
    unmount();
  });
});
