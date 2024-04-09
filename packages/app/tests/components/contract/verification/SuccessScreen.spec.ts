import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount, RouterLinkStub } from "@vue/test-utils";

import SuccessScreen from "@/components/contract/verification/SuccessScreen.vue";

import enUS from "@/locales/en.json";

describe("SuccessScreen", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders links correctly", () => {
    const wrapper = mount(SuccessScreen, {
      global: {
        plugins: [i18n],
        stubs: { RouterLink: RouterLinkStub },
      },
      props: {
        contractAddress: "0x0150673c86121237ac004dbd3371c03f481e4dc3",
      },
    });
    const routerArray = wrapper.findAllComponents(RouterLinkStub);

    expect(routerArray[0].props().to.name).toBe("address");
    expect(routerArray[0].props().to.params.address).toBe("0x0150673c86121237ac004DbD3371C03f481e4Dc3");
    expect(routerArray[1].props().to.name).toBe("address");
    expect(routerArray[1].props().to.params.address).toBe("0x0150673c86121237ac004DbD3371C03f481e4Dc3");
  });
});
