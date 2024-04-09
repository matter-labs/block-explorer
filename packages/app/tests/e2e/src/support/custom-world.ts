import { setWorldConstructor, World } from "@cucumber/cucumber";

import type { IWorldOptions } from "@cucumber/cucumber";
import type * as messages from "@cucumber/messages";
import type { BrowserContext, Page, PlaywrightTestOptions } from "@playwright/test";
import type { AxiosInstance } from "axios";

export interface ICustomWorld extends World {
  debug: boolean;
  feature?: messages.Pickle;
  context?: BrowserContext;
  persistentContext?: BrowserContext;
  page?: Page;
  testName?: string;
  startTime?: Date;
  server?: AxiosInstance;
  playwrightOptions?: PlaywrightTestOptions;
}

export class CustomWorld extends World implements ICustomWorld {
  constructor(options: IWorldOptions) {
    super(options);
  }
  debug = false;
}

setWorldConstructor(CustomWorld);
