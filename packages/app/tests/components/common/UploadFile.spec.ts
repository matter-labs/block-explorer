import { describe, expect, it } from "vitest";

import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/vue";

import UploadFile from "@/components/common/UploadFile.vue";

describe("UploadFile:", () => {
  it("renders component base on input", () => {
    const { getByText } = render(UploadFile, {
      slots: {
        default: "Hello World",
      },
    });

    getByText("Hello World");
  });

  it("trigger event when supported file selected", async () => {
    const user = userEvent.setup({});
    const { container, emitted } = render(UploadFile, {
      slots: {
        default: "Hello World",
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
