import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import PageError from "@/components/PageError.vue";

import enUS from "@/locales/en.json";

describe("PageError:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders component", () => {
    const { container } = render(PageError, {
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".error-page-title")?.textContent).toBe("Something went wrong");
    expect(container.querySelector(".error-page-subtitle")?.textContent).toBe(
      "Unknown request, please try again, or go to the homepage."
    );
    expect(container.querySelector(".home-button")?.textContent).toBe("Homepage");
  });
  it("redirects to home page after the button has been clicked on", async () => {
    const wrapper = mount(PageError, {
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    expect(wrapper.findComponent(RouterLinkStub).props().to.name).toBe("home");
  });
});
