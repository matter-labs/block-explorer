import { describe, expect, it, vi } from "vitest";

import useRouteTitle from "@/composables/useRouteTitle";

const routeParamsMock = vi.fn(() => ({}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    meta: {
      title: "title",
    },
    params: routeParamsMock(),
  }),
}));

describe("useRouteTitle:", () => {
  it("returns correct title for empty params", async () => {
    const { title } = useRouteTitle();
    expect(title.value).toBe("title | document.title");
  });
  it("returns correct title for 'id' param", async () => {
    const mock = routeParamsMock.mockReturnValue({ id: 123 });
    const { title } = useRouteTitle();
    expect(title.value).toBe("title #123 | document.title");
    mock.mockRestore();
  });
  it("returns correct title for 'hash' param", async () => {
    const mock = routeParamsMock.mockReturnValue({
      hash: "0xef76deed76769be2af767bda6375a27300d0efec2c00a2b794a5ea09bb1fb610",
    });
    const { title } = useRouteTitle();
    expect(title.value).toBe("title 0xef76...b610 | document.title");
    mock.mockRestore();
  });
  it("returns correct title for 'address' param", async () => {
    const mock = routeParamsMock.mockReturnValue({
      hash: "0x9c85ac2d94a722e56027db3db728005b29059fc9",
    });
    const { title } = useRouteTitle();
    expect(title.value).toBe("title 0x9c85...9fc9 | document.title");
    mock.mockRestore();
  });
});
