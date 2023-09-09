import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { fireEvent, render } from "@testing-library/vue";

import FilePreview from "@/components/contract/verification/FilePreview.vue";

import enUS from "@/locales/en.json";

describe("FilePreview", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders component properly", () => {
    const { container } = render(FilePreview, {
      global: {
        plugins: [i18n],
      },
      props: {
        name: "ERC20.sol",
        size: 12845,
        index: 0,
      },
    });
    expect(container.querySelector(".index")?.textContent).toBe("1");
    expect(container.querySelector(".name")?.textContent).toBe("ERC20.sol");
  });
  it("emits removeFile event on trash icon click", async () => {
    const { container, emitted } = render(FilePreview, {
      global: {
        plugins: [i18n],
      },
      props: {
        name: "ERC20.sol",
        size: 12845,
        index: 0,
      },
    });
    await fireEvent.click(container.querySelector(".trash-icon")!);
    expect(emitted()).toHaveProperty("removeFile");
  });
});
