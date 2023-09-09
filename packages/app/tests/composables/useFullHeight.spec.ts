import { describe, expect, it, vi } from "vitest";

import useFullHeight from "@/composables/useFullHeight";

describe("useFullHeight", () => {
  const platform = vi.spyOn(window.navigator, "userAgent", "get");

  it("creates useFullHeight composable", () => {
    const result = useFullHeight();
    expect(result.isFullScreen).toBeDefined();
    expect(result.fullScreenHotkey).toBeDefined();
  });
  it("returns Cmd+S fullScreenHotkey label for MacOs", () => {
    platform.mockReturnValue("Mac OS X");
    const { fullScreenHotkey } = useFullHeight();
    expect(fullScreenHotkey.value).toBe("Cmd + S");
  });

  it("returns Cmd+S fullScreenHotkey label for non MacOs", () => {
    platform.mockReturnValue("Win");
    const { fullScreenHotkey } = useFullHeight();
    expect(fullScreenHotkey.value).toBe("Ctrl + S");
  });

  it("opens and exits full screen mode after hotkeys was pressed", async () => {
    const result = useFullHeight();
    const openEvent = new KeyboardEvent("keydown", {
      key: "s",
      code: "KeyS",
      ctrlKey: true,
    });
    const exitEvent = new KeyboardEvent("keydown", {
      code: "Escape",
      ctrlKey: false,
      key: "Escape",
    });
    await global.dispatchEvent(openEvent);
    expect(result.isFullScreen.value).toBe(true);

    await global.dispatchEvent(exitEvent);
    expect(result.isFullScreen.value).toBe(false);
  });
});
