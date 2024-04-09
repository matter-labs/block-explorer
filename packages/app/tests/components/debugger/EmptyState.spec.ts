import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/vue";

import EmptyState from "@/components/debugger/EmptyState.vue";

import enUS from "@/locales/en.json";

describe("EmptyState:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component", () => {
    const { getByText, container } = render(EmptyState, {
      global: {
        plugins: [i18n],
      },
    });

    getByText(enUS.debuggerTool.title);
    getByText(enUS.debuggerTool.whatFor);
    expect(container.querySelector(".upload-file")).not.toBeNull();
  });

  it("renders an alert when hasError is true", () => {
    const { getByText } = render(EmptyState, {
      props: {
        hasError: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    getByText(enUS.debuggerTool.unableToParseTrace);
  });

  it("trigger event when supported file selected", async () => {
    const user = userEvent.setup({});
    const { container, emitted } = render(EmptyState, {
      global: {
        plugins: [i18n],
      },
    });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    const file = new File(["foo"], "foo.json", {
      type: "application/json",
    });
    await user.upload(input, file);
    expect(emitted()).toHaveProperty("update:value", [[[file]]]);
  });
});
