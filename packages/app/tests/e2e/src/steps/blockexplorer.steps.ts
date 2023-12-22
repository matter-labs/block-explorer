/* eslint-disable @typescript-eslint/no-explicit-any */
import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import { Helper } from "../helpers/helper";
import { AccountPage } from "../pages/account.page";
import { BasePage } from "../pages/base.page";
import { BlockPage } from "../pages/block.page";
import { ContractPage } from "../pages/contract.page";
import { MainPage } from "../pages/main.page";
import { TransactionPage } from "../pages/transaction.page";
import { config } from "../support/config";

import type { ICustomWorld } from "../support/custom-world";

let accountPage: AccountPage;
let basePage: BasePage;
let blockPage: BlockPage;
let mainPage: MainPage;
let transactionPage: TransactionPage;
let contractPage: ContractPage;
let helper: Helper;

let result: any;
let element: any;

Given("I am on main page", async function (this: ICustomWorld) {
  await expect(this.page?.url()).toContain(config.BASE_URL);
});

Given("I fill the search field by {string}", async function (this: ICustomWorld, text: string) {
  mainPage = new MainPage(this);
  basePage = new BasePage(this);
  element = mainPage.searchField;

  await basePage.fill(element, text);
});

Given("I press search button", async function (this: ICustomWorld) {
  mainPage = new MainPage(this);
  basePage = new BasePage(this);
  element = mainPage.searchSubmitBtn;

  await basePage.click(element);
});

Then("Current page have {string} address", async function (this: ICustomWorld, route: string) {
  mainPage = new MainPage(this);
  helper = new Helper(this);
  await this.page?.waitForURL("**" + route);
  result = await this.page?.url();

  await expect(result).toBe(config.BASE_URL + route);
});

Then("Current page includes {string} part address", async function (this: ICustomWorld, partRoute: string) {
  mainPage = new MainPage(this);
  helper = new Helper(this);
  await this.page?.waitForURL("**" + partRoute + "**");
  result = await this.page?.url();

  await expect(result).toContain(config.BASE_URL + partRoute);
});

Then("Page with part address {string} includes ID result", async function (this: ICustomWorld, partRoute: string) {
  mainPage = new MainPage(this);
  helper = new Helper(this);

  const networkLayer = await mainPage.getCustomNetworkLayer(element);
  const [currentUrl, pageURL] = await mainPage.getUrlOfTheCurrentPage(
    networkLayer,
    config.BASE_URL,
    partRoute,
    result,
    config.DAPP_NETWORK
  );

  await expect(currentUrl).toBe(pageURL + partRoute + result);
});

Then("New page have {string} address", async function (this: ICustomWorld, url: string) {
  mainPage = new MainPage(this);
  helper = new Helper(this);
  await this.page?.waitForTimeout(config.increasedTimeout.timeout);
  const pages: any = this.context?.pages();

  result = await pages[1].url();
  await expect(result).toBe(url);
});

Given("I go to page {string}", async function (this: ICustomWorld, route: string) {
  await this.page?.goto(config.BASE_URL + route + config.DAPP_NETWORK);
  await this.page?.waitForLoadState();
});

When("I click by text {string}", async function (this: ICustomWorld, text: string) {
  basePage = new BasePage(this);

  await basePage.clickByText(text);
});

When("I click on the first {string} link", async function (this: ICustomWorld, elementType: string) {
  mainPage = new MainPage(this);
  helper = new Helper(this);
  element = await mainPage.getLinkForElement(elementType);
  result = await helper.extractIdFromElementHref(element);

  await mainPage.click(element, false);
});

When("I click on the first contract address", async function (this: ICustomWorld) {
  transactionPage = new TransactionPage(this);
  basePage = new BasePage(this);
  helper = new Helper(this);
  element = transactionPage.contractAddress;
  result = await helper.extractTextFromElement(element);

  await basePage.click(element, false);
});

When("I go to the first Processed transaction link", async function (this: ICustomWorld) {
  mainPage = new MainPage(this);
  basePage = new BasePage(this);
  helper = new Helper(this);
  element = await helper.extractHrefFromElement(mainPage.processedTxLink);

  await this.page?.goto(config.BASE_URL + element);
  await this.page?.waitForLoadState();
});

When("I click by element with partial href {string}", async function (this: ICustomWorld, partialHref: string) {
  mainPage = new MainPage(this);
  element = await mainPage.getElementByPartialHref(partialHref);

  await element.click();
});

When(
  "I click by element with partial href {string} and text {string}",
  async function (this: ICustomWorld, partialHref: string, text: string) {
    mainPage = new MainPage(this);
    element = await mainPage.getElementByHrefAndText(partialHref, text);

    await element.click();
  }
);

When("I click on bytecode dropdown", async function (this: ICustomWorld) {
  contractPage = new ContractPage(this);

  await contractPage.clickOnByteCodeDropDown();
});

When("I click on datatype dropdown of {string} row", async function (this: ICustomWorld, rowName: string) {
  transactionPage = new TransactionPage(this);

  await transactionPage.clickOnDataTypeDropDownByRow(rowName);
});

When("I select {string} as dropdown value", async function (this: ICustomWorld, value: string) {
  mainPage = new MainPage(this);
  basePage = new BasePage(this);
  element = await mainPage.getDropDownValue(value);

  await basePage.click(element);
});

When("I click on main logo", async function (this: ICustomWorld) {
  mainPage = new MainPage(this);
  basePage = new BasePage(this);

  await basePage.click(mainPage.logo, false);
});

When("Message {string} should be visible", async function (this: ICustomWorld, successMessage: string) {
  result = await this.page?.locator(`text=${successMessage}`);

  await expect(result).toBeVisible(config.increasedTimeout);
});

Then(
  "Element with {string} {string} should be {string}",
  async function (this: ICustomWorld, elementType: string, value: string, checkType: string) {
    basePage = new BasePage(this);
    helper = new Helper(this);
    element = await basePage.returnElementByType(elementType, value);

    if (checkType === "visible") {
      await expect(element).toBeVisible(config.increasedTimeout);
    } else if (checkType === "clickable") {
      result = await helper.checkElementClickable(element);
      await expect(result).toBe(true);
    }
  }
);

Then(
  "Element with {string} {string} should have {string} value",
  async function (this: ICustomWorld, elementType: string, text: string, value: string) {
    mainPage = new MainPage(this);

    if (elementType === "text") {
      element = await mainPage.getElementByPartialText(text);
    } else if (elementType === "partial href") {
      element = await mainPage.getElementByPartialHref(text);
    }

    await expect(element).toHaveAttribute("href", value);
  }
);

Then("Title contains text {string}", async function (this: ICustomWorld, text: string) {
  blockPage = new BlockPage(this);
  basePage = new BasePage(this);

  element = await basePage.getElement(blockPage.title);
  await expect(element).toContainText(text);
});

Then("Check the element contains text {string}", async function (this: ICustomWorld, text: string) {
  mainPage = new MainPage(this);
  element = await mainPage.getElementByPartialText(text);

  await expect(element).toContainText(text);
});

Then("Check the element have the exact text {string}", async function (this: ICustomWorld, text: string) {
  mainPage = new MainPage(this);
  element = await mainPage.getElementByText(text);

  await expect(element).toHaveText(text);
});

Then(
  "Table {string} should have {string} rows",
  async function (this: ICustomWorld, tableName: string, rowsNumber: string) {
    mainPage = new MainPage(this);
    result = await mainPage.countRowsInTable(tableName);

    await expect(result).toBe(rowsNumber);
  }
);

Then(
  "Table {string} on Main page contains {string} name",
  async function (this: ICustomWorld, tableName: string, columnName: string) {
    mainPage = new MainPage(this);
    result = await mainPage.getColumnValueInTable(tableName, columnName);

    await expect(result).toBeVisible(config.increasedTimeout);
  }
);

Then("Table contains row with {string}", async function (this: ICustomWorld, rowName: string) {
  transactionPage = new TransactionPage(this);
  result = await this.page?.locator(await transactionPage.getRowByText(rowName)).first();

  await expect(result).toBeVisible(config.increasedTimeout);
});

Then("Table contains cell with {string}", async function (this: ICustomWorld, rowName: string) {
  transactionPage = new TransactionPage(this);
  result = await this.page?.locator(await transactionPage.getCellByText(rowName));

  await expect(result).toBeVisible(config.increasedTimeout);
});

Then(
  "Table on Transaction page contains element with value for {string} row and copying {string}",
  async function (this: ICustomWorld, rowName: string, copying: boolean) {
    transactionPage = new TransactionPage(this);
    result = await this.page?.locator(await transactionPage.getValueInRow(rowName, copying));

    await expect(result).toBeVisible(config.increasedTimeout);
  }
);

Then(
  "Column with {string} name includes {string} cell",
  async function (this: ICustomWorld, columnName: string, cellName: string) {
    contractPage = new ContractPage(this);
    result = await contractPage.getCellValueByColumn(columnName, cellName);
    await expect(result).toBeVisible(config.increasedTimeout);
  }
);

Then("Search field color should be red", async function (this: ICustomWorld) {
  mainPage = new MainPage(this);
  helper = new Helper(this);
  element = mainPage.searchFieldInvalidInput;
  result = await helper.getColorOfSelector(element);
  const colorRed = "rgb(255, 255, 255)";

  await expect(result).toBe(colorRed);
});

Then("I select {string} tab on {string} page", async function (this: ICustomWorld, tabName: string, pageName: string) {
  mainPage = new MainPage(this);

  await mainPage.selectTabOnPage(tabName, pageName);
});

Then("I press Verify Smart Contract button", async function (this: ICustomWorld) {
  contractPage = new ContractPage(this);

  await contractPage.pressContractVerificationBtn();
});

Then("Tab title on {string} contains {string}", async function (this: ICustomWorld, route: string, tabTitle: string) {
  await this.page?.waitForNavigation();
  result = await this.page?.title();

  await expect(result).toBe(tabTitle + " | zkSync 2.0 Block Explorer");
});

Then("Pagination form should be visible", async function (this: ICustomWorld) {
  basePage = new BasePage(this);
  element = basePage.paginationForm;
  result = await this.page?.locator(element);

  await expect(result).toBeVisible(config.increasedTimeout);
});

Then("Column with {string} name is visible", async function (this: ICustomWorld, columnName: string) {
  basePage = new BasePage(this);
  result = await basePage.getColumnByText(columnName);

  await expect(result).toBeVisible(config.increasedTimeout);
});

Then("Network stats {string} block should be visible", async function (this: ICustomWorld, blockName: string) {
  mainPage = new MainPage(this);
  result = await mainPage.getNetworkStatsBlock(blockName);

  await expect(result).toBeVisible(config.increasedTimeout);
});

Then("I click on the first copy button", async function (this: ICustomWorld) {
  mainPage = new MainPage(this);

  await mainPage.clickOnCopyBtn();
});

Then(
  "I click on the copy button with {string} row on {string} page",
  async function (this: ICustomWorld, rowName: string, pageName: string) {
    mainPage = new MainPage(this);

    await mainPage.clickOnCopyBtnByRowPage(rowName, pageName);
  }
);

Then("I click on the copy button for page title", async function (this: ICustomWorld) {
  contractPage = new ContractPage(this);

  await contractPage.clickCopyBtnOnTitle();
});

Then("I click on the copy button for deployed bytecode", async function (this: ICustomWorld) {
  contractPage = new ContractPage(this);

  await contractPage.clickCopyBtnOnByteCode();
});

Then("I click on the copy button for the first token asset", async function (this: ICustomWorld) {
  accountPage = new AccountPage(this);
  helper = new Helper(this);

  await helper.clearClipboard();
  await accountPage.clickCopyBtnByFirstToken();
});

Then("Clipboard contains {string} value", async function (this: ICustomWorld, text: string) {
  helper = new Helper(this);
  result = await helper.getClipboardValue();

  await expect(result).toBe(text);
});

Then("Clipboard includes {string} value", async function (this: ICustomWorld, text: string) {
  helper = new Helper(this);
  result = await helper.getClipboardValue();

  await expect(result.includes(text)).toBe(true);
});

Then("Clipboard value is not empty", async function (this: ICustomWorld) {
  helper = new Helper(this);
  result = await helper.getClipboardValue();

  await expect(typeof result).toBe("string");
  await expect(result.length).toBeGreaterThan(1);
});

When(
  "Set the {string} value for {string} switcher",
  async function (this: ICustomWorld, value: string, switcherType: string) {
    mainPage = new MainPage(this);
    await mainPage.setSwitcherValue(switcherType, value);
  }
);

When(
  "Check the {string} value is actual for {string} switcher",
  async function (this: ICustomWorld, value: string, switcherType: string) {
    mainPage = new MainPage(this);
    result = await mainPage.verifyActualSwitcherValue(switcherType);

    await expect(result).toBeVisible(config.extraTimeout);
    await expect(result).toHaveText(value);
  }
);

Then("Sending spinner should be visible", async function (this: ICustomWorld) {
  transactionPage = new TransactionPage(this);
  result = await this.page?.locator(transactionPage.sendingSpinner);
  await expect(result).toBeVisible(config.increasedTimeout);
});

Then(
  "Status component color with {string} status should be {string}",
  async function (this: ICustomWorld, status: string, color: string) {
    transactionPage = new TransactionPage(this);
    result = await transactionPage.verifyStatusComponentColor(status, color);
    await expect(result).toBe(true);
  }
);

Then("Verify the badge with {string} status is visible", async function (this: ICustomWorld, status: string) {
  transactionPage = new TransactionPage(this);
  result = await transactionPage.getBadgeByStatus(status);
  await expect(result).toBeVisible(config.increasedTimeout);
});
