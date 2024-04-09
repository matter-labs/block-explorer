/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasePage } from "./base.page";

import { pageTitle } from "../../testId.json";

import type { ICustomWorld } from "../support/custom-world";

let element: any;

export class BlockPage extends BasePage {
  constructor(world: ICustomWorld) {
    super(world);
  }
  get title() {
    return `${this.byTestId}${pageTitle}`;
  }

  get copyBtn() {
    return "//td//*[@class='copy-button']";
  }

  async getRowByText(rowName: string) {
    element = `//*[text()='${rowName}'][1]`;
    return element;
  }

  async clickCopyBtnByRow(rowName: string) {
    const copyBtn = this.copyBtn;
    element = (await this.getRowByText(rowName)) + "/..//.." + copyBtn;

    await this.world.page?.locator(element).first().click();
  }
}
