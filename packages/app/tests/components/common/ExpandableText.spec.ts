import { ref } from "vue";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import ExpandableText from "@/components/common/ExpandableText.vue";

describe("ExpandableText:", () => {
  it("renders default slot value", async () => {
    const { getByText, unmount } = render(ExpandableText, {
      slots: {
        default: "Test test",
      },
    });

    expect(getByText("Test test")).toBeTruthy();
    unmount();
  });
  it("renders button slot by default", async () => {
    const { getByText, unmount } = render(ExpandableText, {
      slots: {
        button: "Button text",
      },
    });

    expect(getByText("Button text")).toBeTruthy();
    unmount();
  });
  it("doesn't render show more button if text content height is less than maxHeight", async () => {
    const { container, unmount } = render(ExpandableText, {
      slots: {
        default: "<p>Test test</p>",
        button: "Button text",
      },
      global: {
        mocks: {
          showButton: ref(false),
        },
      },
      props: {
        maxHeight: 300,
      },
    });
    expect(container.querySelector(".expand-button")).toBeFalsy();
    unmount();
  });
});
