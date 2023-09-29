/* eslint-disable @typescript-eslint/no-explicit-any */
import { Status } from "@cucumber/cucumber";

import { config } from "../support/config";

import type { ICustomWorld } from "../support/custom-world";

const tracesDir = config.artifactsFolder;
let element: any;
let result: any;

export class Helper {
  world: ICustomWorld;

  constructor(world: ICustomWorld) {
    this.world = world;
  }

  async checkElementVisible(selector: string, waitTime = config.increasedTimeout.timeout): Promise<boolean> {
    let result = true;
    try {
      await this.world.page?.locator(selector).first().waitFor({
        state: "visible",
        timeout: waitTime,
      });
    } catch (e) {
      console.error(e);
      result = false;
    }
    return result;
  }

  async checkElementClickable(selector: any, waitTime = config.increasedTimeout.timeout): Promise<boolean> {
    let result = true;
    try {
      if (selector == "string") {
        await this.world.page?.locator(selector).click({ trial: true, timeout: waitTime });
      } else {
        await selector.click({ trial: true, timeout: waitTime });
      }
    } catch (e) {
      console.error(e);
      result = false;
    }
    return result;
  }

  async getScreenshotOnFail(result: any): Promise<void> {
    console.log("======== " + result.status + ": " + this.world.testName);
    if (result.status !== Status.PASSED) {
      const image: any = await this.world.page?.screenshot({ path: tracesDir + this.world.testName + ".png" });
      return image;
    }
  }

  async getColorOfSelector(selector: string) {
    element = await this.world.page?.locator(selector);
    const color: any = await element.evaluate((el: any) => {
      return window.getComputedStyle(el).getPropertyValue("background-color");
    });
    return await color;
  }

  async extractTextFromElement(selector: string) {
    element = await this.world.page?.locator(selector).first();
    result = await element.textContent();

    return result;
  }

  async extractHrefFromElement(selector: string) {
    await this.world.page?.waitForTimeout(config.defaultTimeout.timeout);
    element = await this.world.page?.locator(selector).first();
    result = await element.getAttribute("href");

    return result;
  }

  async extractIdFromElementHref(selector: string) {
    element = await this.world.page?.locator(selector).first();
    await this.extractHrefFromElement(selector);
    result = result.match(/[^s/]*$/g)[0];

    return result;
  }

  async getClipboardValue() {
    result = await this.world.page?.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    return result;
  }

  async clearClipboard() {
    result = await this.world.page?.evaluate(async () => {
      return await navigator.clipboard.writeText("");
    });

    return result;
  }

  async compareColors(elementColor: string, expectedColor: string) {
    if (elementColor === expectedColor) {
      return true;
    }
  }

  async checkComponentColor(color: string, selector: string) {
    const colorRed = "rgb(239, 68, 68)";
    const colorGreen = "rgb(187, 247, 208)";
    const colorGrey = "rgb(229, 231, 235)";
    result = await this.getColorOfSelector(selector);
    if (color === "red") {
      element = await this.compareColors(result, colorRed);
    } else if (color === "green") {
      element = await this.compareColors(result, colorGreen);
    } else if (color === "grey") {
      element = await this.compareColors(result, colorGrey);
    }
    return element;
  }
}
