/* eslint-disable @typescript-eslint/no-explicit-any */

import { ref } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import userEvent from "@testing-library/user-event";
import { fireEvent, render } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

import * as useContractVerification from "@/composables/useContractVerification";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import routes from "@/router/routes";
import { CompilerEnum } from "@/types";
import ContractVerificationView from "@/views/ContractVerificationView.vue";

vi.mock("vue-router", () => ({
  useRouter: () => vi.fn(),
  useRoute: () => ({
    query: {
      address: "0x5c221e77624690fff6dd741493d735a17716c26b",
    },
  }),
}));

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(),
    FetchError: function error() {
      return;
    },
  };
});

describe("ContractVerificationView:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("has correct title", async () => {
    expect(i18n.global.t(routes.find((e) => e.name === "contract-verification")?.meta?.title as string)).toBe(
      "Smart Contract Verification"
    );
  });
  it("uses contract address from query", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect((wrapper.find("#contractAddress").element as HTMLInputElement).value).toBe(
      "0x5c221e77624690fff6dd741493d735a17716c26b"
    );
  });
  it("shows solidity single file verification by default", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find("#sourceCode").exists()).toBe(true);
    expect(wrapper.find(".multi-file-verification").exists()).toBe(false);
  });
  it("shows single file verification when vyper single file verification is selection", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(3)`).trigger("click");
    expect(wrapper.find("#sourceCode").exists()).toBe(true);
    expect(wrapper.find(".multi-file-verification").exists()).toBe(false);
  });
  it("shows multi file verification when solidity MFV was selected", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(2)`).trigger("click");
    expect(wrapper.find("#sourceCode").exists()).toBe(false);
    expect(wrapper.find(".multi-file-verification").exists()).toBe(true);
  });
  it("shows multi file verification when vyper MFV was selected", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(4)`).trigger("click");
    expect(wrapper.find("#sourceCode").exists()).toBe(false);
    expect(wrapper.find(".multi-file-verification").exists()).toBe(true);
  });
  it("shows zkVM checkbox by default", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".checkbox-input-container").exists()).toBe(true);
  });
  it("shows zkVM checkbox when solidity MFV was selected", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(2)`).trigger("click");
    expect(wrapper.find(".checkbox-input-container").exists()).toBe(true);
  });
  it("doesn't show zkVM checkbox when vyper single file verification was select", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(3)`).trigger("click");
    expect(wrapper.find(".checkbox-input-container").exists()).toBe(false);
  });
  it("doesn't show zkVM checkbox when vyper MFV was select", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(4)`).trigger("click");
    expect(wrapper.find(".checkbox-input-container").exists()).toBe(false);
  });
  it("shows custom error text", async () => {
    const mock = vi.spyOn(useContractVerification, "default").mockReturnValue({
      ...useContractVerification.default(),
      contractVerificationErrorMessage: ref("This is error"),
    });
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".error-alert").text()).toBe("This is error");
    mock.mockRestore();
  });
  it("shows default error text when error is true", async () => {
    const mock = vi.spyOn(useContractVerification, "default").mockReturnValue({
      ...useContractVerification.default(),
      isRequestFailed: ref(true),
    });
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".error-alert").text()).toBe(i18n.global.t("contractVerification.form.unknownError"));
    mock.mockRestore();
  });
  it("shows compilation errors", async () => {
    const mock = vi.spyOn(useContractVerification, "default").mockReturnValue({
      ...useContractVerification.default(),
      compilationErrors: ref(["Some compilation error"]),
    });
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".compilation-error-log pre").text()).toBe("Some compilation error");
    mock.mockRestore();
  });
  it("doesn't show contract path input when zkSolc version lower than v1.3.6 selected", async () => {
    const mock = vi.spyOn(useContractVerification, "default").mockReturnValue({
      ...useContractVerification.default(),
      compilerVersions: ref({
        solc: {
          name: CompilerEnum.solc,
          isRequestPending: false,
          isRequestFailed: false,
          versions: ["0.8.18"],
        },
        zksolc: {
          name: CompilerEnum.zksolc,
          isRequestPending: false,
          isRequestFailed: false,
          versions: ["v1.3.5", "v1.3.7"],
        },
        vyper: {
          name: CompilerEnum.vyper,
          isRequestPending: false,
          isRequestFailed: false,
          versions: ["0.3.3"],
        },
        zkvyper: {
          name: CompilerEnum.zkvyper,
          isRequestPending: false,
          isRequestFailed: false,
          versions: ["v1.3.9"],
        },
      }),
      requestCompilerVersions: vi.fn(),
    });
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find("#contractPath").exists()).toBe(true);
    await wrapper.find("#zkCompilerVersion").trigger("click");
    await wrapper.find(`[aria-labelledby="zkCompilerVersion"] > li:nth-child(1)`).trigger("click");
    expect(wrapper.find("#contractPath").exists()).toBe(false);
    mock.mockRestore();
  });
  it("doesn't show contract path input when Vyper is selected", async () => {
    const mock = vi.spyOn(useContractVerification, "default").mockReturnValue({
      ...useContractVerification.default(),
      requestCompilerVersions: vi.fn(),
    });
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(3)`).trigger("click");
    expect(wrapper.find("#contractPath").exists()).toBe(false);
    mock.mockRestore();
  });
  it("doesn't show contract path input when MFV is selected", async () => {
    const mock = vi.spyOn(useContractVerification, "default").mockReturnValue({
      ...useContractVerification.default(),
      requestCompilerVersions: vi.fn(),
    });
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(2)`).trigger("click");
    expect(wrapper.find("#contractPath").exists()).toBe(false);
    mock.mockRestore();
  });
  it("shows flattener info when solidity single file verification was selected", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".flattener-info").exists()).toBe(true);
    expect(wrapper.find(".flattener-info").text()).toEqual(
      `If your contract uses "imports", you will need to concatenate the code into one file ( otherwise known as "flattening" ). For that purpose you can use solidity-flattener or SolidityFlattery`
    );
  });
  it("doesn't show flattener info when multi file verification was selected", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(2)`).trigger("click");
    expect(wrapper.find(".flattener-info").exists()).toBe(false);
  });
  it("doesn't show flattener info when vyper verification was selected", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await wrapper.find("#compilerType").trigger("click");
    await wrapper.find(`[aria-labelledby="compilerType"] > li:nth-child(3)`).trigger("click");
    expect(wrapper.find(".flattener-info").exists()).toBe(false);
  });
  it("renders solidity flattener link", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.findAll(".flattener-info a")[0].text()).toEqual("solidity-flattener");
    expect(wrapper.findAll(".flattener-info a")[0].attributes("href")).toEqual(
      "https://github.com/BlockCatIO/solidity-flattener"
    );
  });
  it("renders solidity flattery link", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.findAll(".flattener-info a")[1].text()).toEqual("SolidityFlattery");
    expect(wrapper.findAll(".flattener-info a")[1].attributes("href")).toEqual(
      "https://github.com/DaveAppleton/SolidityFlattery"
    );
  });
  it("renders contract verification link of docs", async () => {
    const wrapper = mount(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    expect(wrapper.find(".docs-link").text()).toEqual("Details");
    expect(wrapper.find(".docs-link").attributes("href")).toEqual(
      "https://docs.zksync.io/build/tooling/block-explorer/contract-verification.html#user-interface"
    );
  });
  it("resets uploaded files block when clicking on clear button", async () => {
    const file = new File(["file"], "file.sol", { type: "application/sol" });
    const user = userEvent.setup({});
    const { container, getByText, unmount } = render(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.click(container.querySelector("#compilerType")!);
    await fireEvent.click(container.querySelector(`[aria-labelledby="compilerType"] > li:nth-child(2)`)!);

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(1);

    const clearButton = getByText("Clear");
    await fireEvent.click(clearButton);

    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(0);
    unmount();
  });
  it("resets main file when clicking on clear button", async () => {
    const file = new File(["file"], "file.sol", { type: "application/sol" });
    const user = userEvent.setup({});
    const { container, getByText, unmount } = render(ContractVerificationView, {
      global: {
        stubs: ["router-link"],
        plugins: [i18n, $testId],
      },
    });

    await fireEvent.click(container.querySelector("#compilerType")!);
    await fireEvent.click(container.querySelector(`[aria-labelledby="compilerType"] > li:nth-child(2)`)!);

    expect(container.querySelector(".multi-file-verification .toggle-button")).toBeNull();

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);

    expect(container.querySelector(".multi-file-verification .toggle-button")?.textContent).toBe("Choose Main File");
    const button = container.querySelector(".multi-file-verification .toggle-button");
    await fireEvent.click(button!);
    const li = container.querySelectorAll(".multi-file-verification .options-list-item");

    await fireEvent.click(li[0]);
    expect(container.querySelector(".multi-file-verification .toggle-button")?.textContent).toBe("file.sol");

    const clearButton = getByText("Clear");
    await fireEvent.click(clearButton);

    expect(container.querySelector(".multi-file-verification .toggle-button")).toBeNull();
    unmount();
  });
});
