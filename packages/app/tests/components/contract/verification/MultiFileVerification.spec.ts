import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import userEvent from "@testing-library/user-event";
import { fireEvent, render } from "@testing-library/vue";

import MultiFileVerification from "@/components/contract/verification/MultiFileVerification.vue";

import enUS from "@/locales/en.json";

import { CompilerEnum } from "@/types";

describe("MultiFileVerification", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    plugins: [i18n],
  };

  const file = new File(["file"], "file.sol", { type: "application/sol" });

  it("renders component default state properly", () => {
    const { container, unmount } = render(MultiFileVerification, { global });

    expect(container.querySelector(".form-item-label")?.textContent).toBe(
      "Please select the Solidity (*.sol) files for upload"
    );
    expect(container.querySelector(".upload-files-label")?.textContent).toBe("Choose Files");

    unmount();
  });
  it("renders files upload error", () => {
    const { container, unmount } = render(MultiFileVerification, {
      global,
      props: {
        errorFiles: "Test error",
      },
    });

    expect(container.querySelector(".upload-file-error")?.textContent).toBe("Test error");

    unmount();
  });
  it("renders mail file dropdown error", () => {
    const { container, unmount } = render(MultiFileVerification, {
      global,
      props: {
        files: [file],
        errorMainFile: "Test error",
      },
    });

    expect(container.querySelector(".dropdown-error")?.textContent).toBe("Test error");

    unmount();
  });
  it("emits update:files event when uploading files", async () => {
    const user = userEvent.setup({});

    const { container, emitted, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);
    expect(emitted()).toHaveProperty("update:files", [[[file]]]);

    unmount();
  });
  it("emits update:mainFile event with an empty string value by default", async () => {
    const user = userEvent.setup({});

    const { container, emitted, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);
    expect(emitted()).toHaveProperty("update:mainFile", [[""]]);

    unmount();
  });
  it("emits update:mainFile event when selecting the main file", async () => {
    const user = userEvent.setup({});

    const { container, emitted, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);

    const button = container.querySelector(".toggle-button");
    await fireEvent.click(button!);
    const li = container.querySelectorAll(".options-list-item");
    await fireEvent.click(li[0]!);
    expect(emitted()).toHaveProperty("update:mainFile", [[""], ["file.sol"]]);

    unmount();
  });
  it("removes file from the preview list", async () => {
    const user = userEvent.setup({});

    const { container, emitted, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(1);
    await fireEvent.click(container.querySelector(".trash-icon")!);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(0);
    expect(emitted()).toHaveProperty("update:files", [[[]]]);

    unmount();
  });
  it("hides files list when all files were removed", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    expect(container.querySelector(".files-list")).toBeFalsy();
    await user.upload(input, file);
    expect(container.querySelector(".files-list")).toBeTruthy();
    await fireEvent.click(container.querySelector(".trash-icon")!);
    expect(container.querySelector(".files-list")).toBeFalsy();

    unmount();
  });
  it("renders 'Choose Main File' select value by default", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);
    expect(container.querySelector(".toggle-button")?.textContent).toBe("Choose Main File");

    unmount();
  });
  it("does not render main file selector for vyper contract verification", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global, props: { compiler: CompilerEnum.vyper } });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;

    await user.upload(input, file);
    expect(container.querySelector(".toggle-button")).toBeNull();

    unmount();
  });
  it("doesn't accept another format except '.sol' to upload for solidity contract verification", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;
    const jsonFile = new File(["file"], "file.vy", { type: "application/json" });

    expect(container.querySelector(".files-list")).toBeFalsy();

    await user.upload(input, jsonFile);

    expect(container.querySelector(".files-list")).toBeFalsy();
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(0);

    unmount();
  });
  it("doesn't accept another format except '.vy' to upload for vyper contract verification", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global, props: { compiler: CompilerEnum.vyper } });

    const input = container.querySelector<HTMLInputElement>("#uploadFileInput")!;
    const jsonFile = new File(["file"], "file.sol", { type: "application/json" });

    expect(container.querySelector(".files-list")).toBeFalsy();

    await user.upload(input, jsonFile);

    expect(container.querySelector(".files-list")).toBeFalsy();
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(0);

    unmount();
  });
  it("updates upload file component after removing the file from the preview list", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global });

    await user.upload(container.querySelector<HTMLInputElement>("#uploadFileInput")!, file);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(1);

    await fireEvent.click(container.querySelector(".trash-icon")!);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(0);

    await user.upload(container.querySelector<HTMLInputElement>("#uploadFileInput")!, file);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(1);

    unmount();
  });
  it("doesn't upload the same file twice", async () => {
    const user = userEvent.setup({});

    const { container, unmount } = render(MultiFileVerification, { global });

    await user.upload(container.querySelector<HTMLInputElement>("#uploadFileInput")!, file);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(1);

    await user.upload(container.querySelector<HTMLInputElement>("#uploadFileInput")!, file);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(1);

    const file2 = new File(["file"], "file2.sol", { type: "application/sol" });

    await user.upload(container.querySelector<HTMLInputElement>("#uploadFileInput")!, file2);
    expect(container.querySelectorAll(".file-preview-container")).toHaveLength(2);

    unmount();
  });
});
