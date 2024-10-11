import { defineConfig, devices } from "@playwright/test";
import { config } from "tests/ui/config";

export default defineConfig({
  testDir: "tests/ui",
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
