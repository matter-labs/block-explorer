import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";

import ContentLoader from "@/components/common/loaders/ContentLoader.vue";

describe("ContentLoader", () => {
  it("renders", () => {
    const { container } = render(ContentLoader);
    expect(container.querySelector(".content-loader")).toBeTruthy();
  });
});
