import { After, AfterAll, Before, setDefaultTimeout } from "@cucumber/cucumber";
import { Status } from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import dappwright, { MetaMaskWallet } from "@tenkeylabs/dappwright";

import { Helper } from "../helpers/helper";
import { config } from "../support/config";

import type { ICustomWorld } from "./custom-world";
import type { ITestCaseHookParameter } from "@cucumber/cucumber/lib/support_code_library_builder/types";
import type { Browser } from "@playwright/test";

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 1000);

let browser: Browser | null = null;
let prividiumBrowser: Browser | null = null;

Before({ tags: "@ignore" }, async function () {
  return Status.SKIPPED;
});

Before({ tags: "not @prividium" }, async function (this: ICustomWorld, { pickle }: ITestCaseHookParameter) {
  this.testName = pickle.name.replace(/\W/g, "-");

  if (!browser) {
    browser = await chromium.launch({ slowMo: config.slowMo, headless: config.headless });
  }

  const context = await browser.newContext({ viewport: config.mainWindowSize });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  this.context = context;
  this.page = await context.newPage();
  this.feature = pickle;

  await this.page.goto(config.BASE_URL + config.DAPP_NETWORK);
  await this.page.waitForLoadState();
});

After({ tags: "not @prividium" }, async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  await new Helper(this).getScreenshotOnFail(result);
  await this.page?.close();
});

Before({ tags: "@prividium" }, async function (this: ICustomWorld, { pickle }: ITestCaseHookParameter) {
  this.testName = pickle.name.replace(/\W/g, "-");

  process.env.TEST_PARALLEL_INDEX = "0";
  process.env.TARGET_ENV = "http://127.0.0.1:3010";

  const [metamask, , context] = await dappwright.bootstrap("", {
    wallet: "metamask",
    version: MetaMaskWallet.recommendedVersion,
    slowMo: config.slowMo,
    headless: false,
    viewport: config.mainWindowSize,
    use: {
      trace: "on-first-retry",
    },
    recordVideo: { dir: config.artifactsFolder },
    seed: "test test test test test test test test test test test junk",
  });

  this.context = context;
  this.metamask = metamask;
  this.browser = context.browser();

  prividiumBrowser = this.browser;

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  this.page = await context.newPage();
  this.feature = pickle;

  await context.tracing.start({ screenshots: true, snapshots: true });

  await this.page.goto(`${config.BASE_URL}/login`);
  await this.page.waitForLoadState();
});

After({ tags: "@prividium" }, async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  await new Helper(this).getScreenshotOnFail(result);
  await this.context?.close();
  await this.browser?.close();
});

AfterAll(async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
  if (prividiumBrowser) {
    await prividiumBrowser.close();
    prividiumBrowser = null;
  }
});
