import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import CompilationInfo from "@/components/contract/CompilationInfo.vue";

import ERC20Contract from "@/../mock/contracts/ERC20.json";
import enUS from "@/locales/en.json";

describe("CompilationInfo", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders component properly", async () => {
    const { container } = render(CompilationInfo, {
      props: {
        contract: ERC20Contract.info,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(container.querySelectorAll(".label")[0].textContent).toEqual("Contract Name");
    expect(container.querySelectorAll(".text")[0].textContent).toEqual("DARA2");
    expect(container.querySelectorAll(".label")[1].textContent).toEqual("Compiler Version");
    expect(container.querySelectorAll(".text")[1].textContent).toEqual("0.8.16");
    expect(container.querySelectorAll(".label")[2].textContent).toEqual("Zksolc Version");
    expect(container.querySelectorAll(".text")[2].textContent).toEqual("v1.1.5");
    expect(container.querySelectorAll(".label")[3].textContent).toEqual("Optimization");
    expect(container.querySelectorAll(".text")[3].textContent).toEqual("Yes");
  });
  it("renders Optimization 'no' if optimizationUsed value is false", async () => {
    const { container } = render(CompilationInfo, {
      props: {
        contract: {
          ...ERC20Contract.info,
          verificationInfo: {
            ...ERC20Contract.info.verificationInfo,
            request: {
              ...ERC20Contract.info.verificationInfo.request,
              optimizationUsed: false,
            },
          },
        },
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelectorAll(".text")[3].textContent).toEqual("No");
  });
});
