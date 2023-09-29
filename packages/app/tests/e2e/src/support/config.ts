import { NetworkSwitcher } from "../data/data";

import type { LaunchOptions } from "@playwright/test";

const browserOptions: LaunchOptions = {
  slowMo: 10,
  devtools: true,
  headless: false,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--disable-web-security"],
};

export const config = {
  browser: process.env.BROWSER || "chromium",
  browserOptions,
  BASE_URL: process.env.TARGET_ENV || "http://localhost:3010",
  mainWindowSize: { width: 1920, height: 1080 },
  artifactsFolder: "tests/e2e/artifacts/",
  DAPP_NETWORK: process.env.E2ENETWORK || NetworkSwitcher.zkSyncEraMainnet,
  headless: true,
  slowMo: 10,
  defaultTimeout: { timeout: 5000 },
  increasedTimeout: { timeout: 17000 },
  extraTimeout: { timeout: 60000 },
};
