import { describe, expect, it } from "vitest";

import { readFileSync } from "fs";
import { runInNewContext } from "vm";

const script = readFileSync(new URL("../../public/runtime-base.js", import.meta.url), "utf8");

describe("runtime base bootstrap", () => {
  it.each([
    [{}, "/", "/"],
    [{ appBase: "/explorer/" }, "/explorer/", "/explorer/"],
    [{ appBase: "/explorer" }, "/explorer", "/explorer/"],
    [{ appBase: "/explorer/", version: "v1" }, "/explorer/", "/explorer/"],
    [{ assetsUrl: "https://cdn.example.com/assets" }, "/", "https://cdn.example.com/assets/"],
    [
      { appBase: "/explorer/", assetsUrl: "https://cdn.example.com/assets/", version: "v1" },
      "/explorer/",
      "https://cdn.example.com/assets/v1/",
    ],
    [
      { assetsUrl: "https://cdn.example.com/assets", version: "v1", assetsVersioned: "false" },
      "/",
      "https://cdn.example.com/assets/",
    ],
  ])("initializes paths for %j", (dataset, appBase, assetsBase) => {
    const context = { document: { currentScript: { dataset } }, window: {} };
    runInNewContext(script, context);
    expect(context.window).toEqual({ __APP_BASE__: appBase, __ASSETS_BASE__: assetsBase });
  });
});
