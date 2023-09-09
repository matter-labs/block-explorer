import { ref } from "vue";

import { describe, expect, it, vi } from "vitest";

import useLocalization from "@/composables/useLocalization";

vi.mock("./../locales/en.json", () => {
  return {
    welcome: "Welcome",
  };
});

vi.mock(`vue-i18n`, () => ({
  useI18n: () => ({}),
}));

describe("useLocalization:", () => {
  it("creates composable", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = useLocalization();
    expect(result.setup).toBeDefined();
    expect(result.changeLanguage).toBeDefined();
  });

  describe("setup:", () => {
    it("changes a location to the one stored in storage", async () => {
      const locale = ref("en");

      const result = useLocalization(
        {
          availableLocales: ["en", "uk"],
          locale,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        ref("en")
      );

      await result.setup();

      expect(locale.value).toEqual("en");
    });
  });

  describe("changeLanguage:", () => {
    it.skip("loads messages for a missing locale", async () => {
      const setLocaleMessage = vi.fn();
      const result = useLocalization({
        availableLocales: [],
        setLocaleMessage,
        locale: ref("en"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await result.changeLanguage("en");

      expect(vi.isMockFunction(setLocaleMessage)).toBe(true);
      expect(setLocaleMessage.mock.calls[0]).toEqual(["en", { welcome: "Welcome" }]);
    });

    it("saves a locale to localStorage", async () => {
      const storage = ref("en");

      const setLocaleMessage = vi.fn();

      const result = useLocalization(
        {
          availableLocales: [],
          setLocaleMessage,
          locale: ref("en"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        storage
      );

      await result.changeLanguage("uk");
      expect(storage.value).toEqual("uk");
    });

    it("sets a locale to a document html attribute", async () => {
      const storage = ref("en");

      const setLocaleMessage = vi.fn();

      const result = useLocalization(
        {
          availableLocales: [],
          setLocaleMessage,
          locale: ref("en"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        storage
      );

      await result.changeLanguage("uk");

      expect(document.documentElement.getAttribute("lang")).toEqual("uk");
    });

    it("sets a locale to a i18n", async () => {
      const storage = ref("en");

      const locale = ref("en");

      const result = useLocalization(
        {
          availableLocales: [],
          setLocaleMessage: vi.fn(),
          locale,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        storage
      );

      await result.changeLanguage("uk");

      expect(locale.value).toEqual("uk");
    });
  });
});
