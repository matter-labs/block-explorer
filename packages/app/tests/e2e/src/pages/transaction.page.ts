/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasePage } from "./base.page";
import { MainPage } from "./main.page";
import { Helper } from "../helpers/helper";

import type { ICustomWorld } from "../support/custom-world";

let element: any;
let result: any;
let helper: Helper;

export class TransactionPage extends BasePage {
  constructor(world: ICustomWorld) {
    super(world);
  }

  get actualString() {
    return "//span[@class='actual-string']";
  }

  get contractAddress() {
    return "//*[text()='To']/../..//a[contains(@href,'/address/')]";
  }

  get generalInfoTab() {
    return "//button[contains(text(),'General Info')]/..";
  }

  get logsTab() {
    return "//button[contains(text(),'Logs')]/..";
  }

  get badgeContent() {
    return "//*[@class='badge-content']";
  }

  get dataType() {
    return "//*[@class='convert-dropdown-container']";
  }

  get sendingSpinner() {
    return "(//*[@class='badge-icon']//*[@class])[1]";
  }

  async getRowByText(rowName: string) {
    element = `//tr//*[text()='${rowName}'][1]`;
    return element;
  }

  async getCellByText(rowName: string) {
    element = `//tr//td//*[text()='${rowName}'][1]`;
    return element;
  }

  async getValueInRow(row: string, copying: boolean) {
    element = copying
      ? (await this.getRowByText(row)) + `//..//*[@title]`
      : (await this.getRowByText(row)) + `//..//td[text()][2]`;

    return element;
  }

  async selectTab(tabName: string) {
    if (tabName === "General Info") {
      await this.click(this.generalInfoTab, false);
    } else if (tabName === "Logs") {
      await this.click(this.logsTab, false);
    } else {
      console.error("Incorrect Tab name. The value should be only General Info or Logs");
    }
  }

  async clickCopyBtnByRow(rowName: string) {
    const mainPage = new MainPage(this.world);
    const copyBtn = mainPage.copyBtn;

    if (rowName === "Data" || rowName === "Topics") {
      element = (await this.getRowByText(rowName)) + "/.." + copyBtn;
    } else {
      element = (await this.getRowByText(rowName)) + "/../.." + copyBtn;
    }
    await this.world.page?.locator(element).first().click();
  }

  async clickOnDataTypeDropDownByRow(rowName: string) {
    element = (await this.getRowByText(rowName)) + "/.." + this.dataType;
    await this.world.page?.locator(element).first().click();
  }

  async verifyStatusComponentColor(status: string, color: string) {
    helper = new Helper(this.world);
    result = await helper.checkComponentColor(color, `//*[@${this.byTestId}'${status}']/*[@${this.byTestId}'badge']`); // //*[@class='status-badge' and contains(. ,'${status}')]
    return result;
  }

  async getBadgeByStatus(text: string) {
    result = await this.world.page?.locator(`(${this.badgeContent}//*[text()='${text}'])[1]`);
    return result;
  }
}
