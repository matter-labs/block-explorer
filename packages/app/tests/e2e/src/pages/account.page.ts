/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasePage } from "./base.page";

import { tokensIcon } from "../../testId.json";

import type { ICustomWorld } from "../support/custom-world";

let element: any;

export class AccountPage extends BasePage {
  constructor(world: ICustomWorld) {
    super(world);
  }

  get copyBtn() {
    return "//td//*[@class='copy-button']";
  }

  get tokenIcon() {
    return `${this.byTestId}${tokensIcon}`;
  }

  get firstTokenAsset() {
    return "//*[@class='token-symbol'][1]";
  }

  async configureTokenIcon() {
    const address: any = await this.world.page?.url();
    const id: object = await address.match(/[^s/]*$/g)[0];
    const element = tokensIcon;
    const configuredElement = `//td[@data-heading='Fee']//a[@data-testid='${element}']`;
    if (await address.includes("blocks")) {
      return configuredElement;
    } else if ((await address.includes("transactions")) && id) {
      return this.tokenIcon;
    } else if (!id) {
      return configuredElement;
    }
  }

  async getRowName(row: string) {
    element = `//td[text()='${row}']`;

    return element;
  }

  async getValueInRow(row: string, copying: boolean) {
    element = copying
      ? (await this.getRowName(row)) + `//..//*[@title]`
      : (await this.getRowName(row)) + `/../..//*[@class='block-info-field-value']`;

    return element;
  }

  async clickCopyBtnByFirstToken() {
    const rowName = this.firstTokenAsset;
    const copyBtn = this.copyBtn;
    element = rowName + "/..//..//..//..//.." + copyBtn;

    await this.world.page?.locator(element).first().click();
  }
}
