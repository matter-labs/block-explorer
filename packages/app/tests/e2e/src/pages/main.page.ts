/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasePage } from "./base.page";
import { BlockPage } from "./block.page";
import { ContractPage } from "./contract.page";
import { TokensPage } from "./tokens.page";
import { TransactionPage } from "./transaction.page";

import {
  blocksNumber,
  blocksTable,
  fromAddress,
  initiatorsAddress,
  latestBatchesTable,
  latestTransactionsTable,
  toAddress,
  tokenAddress,
  tokensIcon,
  tokensTable,
  transactionsHash,
  transactionsTable,
} from "../../testId.json";

import type { ICustomWorld } from "../support/custom-world";

let blockPage: BlockPage;
let tokensPage: TokensPage;
let transactionPage: TransactionPage;
let element: any;
let result: any;

export class MainPage extends BasePage {
  constructor(world: ICustomWorld) {
    super(world);
  }

  get title() {
    return ".title";
  }

  get logo() {
    return "//*[text()='zkSync']/..";
  }

  get searchField() {
    return "id=search";
  }

  get searchSubmitBtn() {
    return "//*[@type='submit']";
  }

  get searchFieldInvalidInput() {
    return ".search-input.has-error";
  }

  get selectedNetwork() {
    return "//*[@class='network-item-label']";
  }

  get selectedLanguage() {
    return "//*[@class='selected-language-label']";
  }

  async setSwitcherLanguage(languageOption: string) {
    return `//*[@class='language-list']//*[text()='${languageOption}']`;
  }

  async setSwitcherNetwork(networkOption: string) {
    return `//*[@class='network-list']//*[contains(text(), '${networkOption}')]`;
  }

  get txHash() {
    return "//span[@class='transactions-data-link'][1]/a";
  }

  get batchNumber() {
    return "//*[@data-heading='Batch']/a";
  }

  get batchSize() {
    return "//*[@data-heading='Size']/a";
  }

  get committedBlocks() {
    return "//*[text()='Committed Blocks']";
  }

  get verifiedBlocks() {
    return "//*[text()='Verified Blocks']";
  }

  get transactions() {
    return "//*[text()='Transactions']";
  }

  get fromAddress() {
    return `${this.byTestId}${fromAddress}`;
  }

  get toAddress() {
    return `${this.byTestId}${toAddress}`;
  }

  get initiatorAddress() {
    return `${this.byTestId}${initiatorsAddress}`;
  }

  get tokenIcon() {
    return `${this.byTestId}${tokensIcon}`;
  }

  get transactionsHash() {
    return `${this.byTestId}${transactionsHash}`;
  }

  get tokenAddress() {
    return `${this.byTestId}${tokenAddress}`;
  }

  get blockNumber() {
    return `${this.byTestId}${blocksNumber}`;
  }

  get blocksTable() {
    return blocksTable;
  }

  get latestBatchesTable() {
    return latestBatchesTable;
  }

  get latestTransactionTable() {
    return latestTransactionsTable;
  }

  get tokensTable() {
    return tokensTable;
  }

  get transactionsTable() {
    return transactionsTable;
  }

  get networkStats() {
    return "//*[@class='card network-stats']";
  }

  get processedTxLink() {
    return `//*[td[contains(., 'Processed')]]//*[@data-testid='transactions-hash'][1]`;
  }

  get copyBtn() {
    return "//*[@class='copy-button'][1]";
  }

  private async getRowTable(testid: string) {
    element = `//*[@data-testid='${testid}']//tbody/tr`;
    return element;
  }

  private async getColumnValue(testid: string, columnName: string) {
    element = `//*[contains(@data-testid,'${testid}')]//*[text()='${columnName}']`;
    return element;
  }

  async getDropDownValue(value: string) {
    element = `//label[@href]//*[contains(text(),'${value}')] | 
               //label[contains(text(),'${value}')]`;
    return await element;
  }

  async countRowsInTable(table: string) {
    if (table === "Latest Batches") {
      element = this.latestBatchesTable;
    } else if (table === "Latest Transactions") {
      element = this.latestTransactionTable;
    } else if (table === "Blocks") {
      element = this.blocksTable;
    } else if (table === "Transactions") {
      element = this.transactionsTable;
    } else if (table === "Tokens") {
      element = this.tokensTable;
    }

    const row: string = await this.getRowTable(element);
    const rows: any = await this.world.page?.locator(row);
    await this.world.page?.waitForSelector(row);
    const countRows: any = await rows.count();
    result = countRows.toString();

    return result;
  }

  async getColumnValueInTable(table: string, column: string) {
    let tableDataId: any;
    if (table === "Latest Batches") {
      tableDataId = this.latestBatchesTable;
    } else if (table === "Latest Transactions") {
      tableDataId = this.latestTransactionTable;
    } else if (table === "Blocks") {
      tableDataId = this.blocksTable;
    } else if (table === "Transactions") {
      tableDataId = this.transactionsTable;
    }

    element = await this.getColumnValue(tableDataId, column);
    result = await this.world.page?.locator(element).first();

    return result;
  }

  async getNetworkStatsBlock(text: string) {
    element = this.networkStats + `//*[text()='${text}']`;
    result = await this.world.page?.locator(element).first();

    return result;
  }

  async selectTabOnPage(tabName: string, pageName: string) {
    const transactionPage = new TransactionPage(this.world);
    const contractPage = new ContractPage(this.world);

    if (pageName === "Contract") {
      await contractPage.selectTab(tabName);
    } else if (pageName === "Transaction") {
      await transactionPage.selectTab(tabName);
    } else {
      console.error("Incorrect Page name. The value should be only Contract or Transaction");
    }
  }

  async clickOnCopyBtn() {
    element = await this.world.page?.locator(this.copyBtn).first();
    await element.click();
  }

  async clickOnCopyBtnByRowPage(rowName: string, pageName: string) {
    blockPage = new BlockPage(this.world);
    transactionPage = new TransactionPage(this.world);
    tokensPage = new TokensPage(this.world);

    if (pageName === "Transaction" || pageName === "Contract") {
      result = await transactionPage.clickCopyBtnByRow(rowName);
    } else if (pageName === "Account" || pageName === "Block") {
      result = await blockPage.clickCopyBtnByRow(rowName);
    } else if (pageName === "Tokens") {
      result = await tokensPage.clickCopyBtnByRow(rowName);
    }
    return result;
  }

  async setSwitcherValue(switcherType: string, value: string) {
    const switcherDropdown = async (selector: string) => {
      return await this.click(selector);
    };
    if (switcherType === "language") {
      await switcherDropdown(this.selectedLanguage);
      result = await switcherDropdown(await this.setSwitcherLanguage(value));
    } else if (switcherType === "network") {
      await switcherDropdown(this.selectedNetwork);
      result = await switcherDropdown(await this.setSwitcherNetwork(value));
    } else {
      console.error("Incorrect value for switcher type");
    }
  }

  async verifyActualSwitcherValue(switcherType: string) {
    const actualValue = async (selector: string) => {
      return await this.world.page?.locator(selector);
    };
    if (switcherType === "language") {
      result = await actualValue(this.selectedLanguage);
    } else if (switcherType === "network") {
      result = await actualValue(this.selectedNetwork);
    } else {
      console.error("Incorrect value for switcher type");
    }
    return result;
  }

  async getTokenFromColumn(columnName: string) {
    const tokenIconId = `//*[@${this.byTestId}'${tokensIcon}']`;
    const dataHeadingID = `//*[@${this.byDataHeading}'${columnName}']`;
    const textHeadingID = `//*[text()='${columnName}']`;
    element = `${dataHeadingID}${tokenIconId} | ${textHeadingID}/../..${tokenIconId}`;
    return element;
  }

  async getLinkForElement(elementType: string) {
    if (elementType === "tx hash") {
      element = this.txHash;
    } else if (elementType === "batch number") {
      element = this.batchNumber;
    } else if (elementType === "batch size") {
      element = this.batchSize;
    } else if (elementType === "committed blocks") {
      element = this.committedBlocks;
    } else if (elementType === "verified blocks") {
      element = this.verifiedBlocks;
    } else if (elementType === "transactions") {
      element = this.transactions;
    } else if (elementType === "initiator address") {
      element = this.initiatorAddress;
    } else if (elementType === "token icon") {
      element = this.tokenIcon;
    } else if (elementType === "transaction hash") {
      element = this.transactionsHash;
    } else if (elementType === "token address") {
      element = this.tokenAddress;
    } else if (elementType === "block number") {
      element = this.blockNumber;
    } else if (elementType === "from address") {
      element = this.fromAddress;
    } else if (elementType === "to address") {
      element = this.toAddress;
    } else if (elementType === "Value" || elementType === "Fee") {
      element = await this.getTokenFromColumn(elementType);
    } else if (
      elementType === "To" ||
      elementType === "Commit Tx hash" ||
      elementType === "Execute Tx hash" ||
      elementType === "Prove Tx hash" ||
      elementType === "Tokens Transferred"
    ) {
      element = await this.getRandomToken(elementType);
    }
    return await element;
  }

  async getRandomToken(columnName: string) {
    element = `//*[text()='${columnName}']/../..//*[@href]`;
    return element;
  }
}
