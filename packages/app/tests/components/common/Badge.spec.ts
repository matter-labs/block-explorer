import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import Badge from "@/components/common/Badge.vue";

import $testId from "@/plugins/testId";

describe("Badge", () => {
  const global = {
    plugins: [$testId],
  };
  it("renders default and icon slot", async () => {
    const { findByText, unmount } = render(Badge, {
      global,
      slots: {
        default: "Test slot content",
      },
    });
    await findByText("Test slot content");
    unmount();
  });
  it("adds has-icon class when icon slot is not empty", async () => {
    const { getByTestId, findByText, unmount } = render(Badge, {
      global,
      slots: {
        icon: "Test icon slot content",
      },
    });
    expect(getByTestId("badge")?.classList.contains("has-icon")).toBe(true);
    await findByText("Test icon slot content");
    unmount();
  });
  it("properly uses size props", async () => {
    const { getByTestId, rerender, unmount } = render(Badge, { global });
    expect(getByTestId("badge")?.classList.contains("size-sm")).toBe(true);
    await rerender({
      size: "md",
    });
    expect(getByTestId("badge")?.classList.contains("size-md")).toBe(true);
    unmount();
  });
  it("properly uses type props", async () => {
    const { getByTestId, rerender, unmount } = render(Badge, { global });
    expect(getByTestId("badge")?.classList.contains("type-label")).toBe(true);
    await rerender({ type: "pill" });
    expect(getByTestId("badge")?.classList.contains("type-pill")).toBe(true);
    unmount();
  });
  it("properly uses color props", async () => {
    const { getByTestId, rerender, unmount } = render(Badge, { global });
    expect(getByTestId("badge")?.classList.contains("color-neutral")).toBe(true);
    await rerender({ color: "secondary" });
    expect(getByTestId("badge")?.classList.contains("color-secondary")).toBe(true);
    unmount();
  });
  it("shows tooltip on hover", async () => {
    const { findByText, unmount } = render(Badge, {
      global,
      props: {
        tooltip: "Test tooltip text",
      },
    });
    await findByText("Test tooltip text");
    unmount();
  });
});
