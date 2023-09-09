import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

const execCommandMock = vi.fn();

global.document.execCommand = execCommandMock;

const copyMock = vi.fn();
const isCopiedMock = vi.fn(() => false);
vi.mock("@vueuse/core", () => {
  return {
    useClipboard: () => ({
      copy: copyMock,
      copied: computed(isCopiedMock),
    }),
    useThrottleFn: (fn: () => void) => fn,
  };
});

import CopyButton from "@/components/common/CopyButton.vue";

import enUS from "@/locales/en.json";

describe("CopyButton:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("copy to clipboard method is triggered when button was clicked", async () => {
    const mock = copyMock.mockClear();
    const wrapper = mount(CopyButton, {
      props: {
        value: "",
      },
      global: {
        plugins: [i18n],
      },
    });
    await wrapper.find(".copy-button").trigger("click");
    expect(mock).toHaveBeenCalledOnce();
  });
  it("copy tooltip displays when copied is true", async () => {
    isCopiedMock.mockReturnValueOnce(true);
    const wrapper = render(CopyButton, {
      props: {
        value: "",
      },
      global: {
        plugins: [i18n],
      },
    });
    wrapper.findByText("Copied!");
  });
  it("uses legacy copy when default copy function throws error", async () => {
    copyMock.mockRejectedValueOnce(new Error(""));
    const wrapper = mount(CopyButton, {
      props: {
        value: "",
      },
      global: {
        plugins: [i18n],
      },
    });
    await wrapper.find(".copy-button").trigger("click");
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });
});
