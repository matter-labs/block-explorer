import { setWorldConstructor, World } from "@cucumber/cucumber";

import type { IWorldOptions } from "@cucumber/cucumber";
import type { Pickle } from "@cucumber/messages";
import type { PlaywrightTestOptions } from "@playwright/test";
import type { Dappwright } from "@tenkeylabs/dappwright";
import type { AxiosInstance } from "axios";
import type { Browser, BrowserContext, Page } from "playwright-core";

export interface ICustomWorld extends World {
  browser?: Browser | null;
  context?: BrowserContext;
  page?: Page;
  feature?: Pickle;
  server?: AxiosInstance;
  playwrightOptions?: PlaywrightTestOptions;
  metamask?: Dappwright;
  testName?: string;
}

export class CustomWorld extends World implements ICustomWorld {
  metamask: Dappwright | undefined;
  constructor(options: IWorldOptions) {
    super(options);
  }
  debug = false;
}

setWorldConstructor(CustomWorld);
