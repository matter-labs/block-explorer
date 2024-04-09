/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasePage } from "./base.page";
import { MainPage } from "./main.page";

import {
  byteCodeDropDown,
  contractVerificationButton,
  optimizationRadioButtons,
  transactionsTable,
} from "../../testId.json";

import type { ICustomWorld } from "../support/custom-world";

let element: any;
let result: any;

export class ContractPage extends BasePage {
  constructor(world: ICustomWorld) {
    super(world);
  }
  get transactionsTab() {
    return "//button[text()='Transactions']/..";
  }

  get contractTab() {
    return "//button[text()='Contract']/..";
  }

  get contractVerificationBtn() {
    return contractVerificationButton;
  }

  get radioButtons() {
    return optimizationRadioButtons;
  }

  get byteCode() {
    return byteCodeDropDown;
  }

  get transactionsTable() {
    return transactionsTable;
  }

  get title() {
    return "//*[@data-testid='page-title']";
  }

  async selectTab(tabName: string) {
    if (tabName === "Transactions") {
      await this.click(this.transactionsTab, false);
    } else if (tabName === "Contract") {
      await this.click(this.contractTab, false);
    } else {
      console.error("Incorrect Tab name. The value should be only Contract or Transactions");
    }
  }

  private async getColumnValue(testid: string, columnName: string) {
    element = `//*[@data-testid='${testid}']//td[@data-heading="${columnName}"]`;
    return element;
  }

  async getCellValueByColumn(columnName: string, cellName: string) {
    element = `//td[@data-heading="${columnName}"]//*[text()='${cellName}']`;
    result = await this.world.page?.locator(element).first();
    return result;
  }

  async pressContractVerificationBtn() {
    await this.click(this.contractVerificationBtn, true);
  }

  async clickOnByteCodeDropDown() {
    await this.click(this.byteCode, true);
  }

  async clickCopyBtnOnTitle() {
    const mainPage = new MainPage(this.world);
    const copyBtn = mainPage.copyBtn;
    const title = this.title;
    element = title + copyBtn;

    await this.world.page?.locator(element).first().click();
  }

  async clickCopyBtnOnByteCode() {
    const mainPage = new MainPage(this.world);
    const copyBtn = mainPage.copyBtn;
    const row = `//*[@data-testid='${this.byteCode}']`;
    element = row + copyBtn;

    await this.world.page?.locator(element).first().click();
  }
}
