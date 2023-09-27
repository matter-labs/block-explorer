import { defineConfig, devices } from "@playwright/test";
import { config } from "tests/sdk-ui/config";

export default defineConfig({
  testDir: "tests/sdk-ui",
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
