import { defineConfig, devices } from "@playwright/test";
import { config } from "tests/e2e/config";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          headless: config.headless,
        },
        contextOptions: {
          viewport: config.mainWindowSize,
        },
      },
    },
  ],
});
