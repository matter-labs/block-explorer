/* eslint-disable @typescript-eslint/no-explicit-any */
import { Helper } from "../helpers/helper";
import { config } from "../support/config";

import type { ICustomWorld } from "../support/custom-world";

let selector: any;
let element: any;
let helper: any;
let result: any;

export class BasePage {
  world: ICustomWorld;

  constructor(world: ICustomWorld) {
    this.world = world;
  }

  get paginationForm() {
    return "//*[@aria-label='Pagination']";
  }

  async getColumnByText(text: string) {
    element = `//th[text()="${text}"]`;
    result = await this.world.page?.locator(element).first();

    return result;
  }

  get byTestId() {
    return "data-testid=";
  }

  get byDataHeading() {
    return "data-heading=";
  }

  async click(element: any, testId?: boolean) {
    helper = new Helper(this.world);
    selector = element;
    if (testId) {
      selector = this.byTestId + element;
    }
    await helper.checkElementVisible(selector);
    await this.world.page?.locator(selector).first().click({ force: true, timeout: config.increasedTimeout.timeout });
  }

  async dblClick(element: any) {
    await this.world.page?.locator(element).first().dblclick({ force: true, timeout: config.increasedTimeout.timeout });
  }

  async fill(element: any, text: string, testId?: boolean) {
    helper = new Helper(this.world);
    selector = element;
    if (testId) {
      selector = this.byTestId + element;
    }
    await helper.checkElementVisible(selector);
    await this.world.page?.fill(selector, text);
  }

  async clickByText(text: string) {
    selector = `//*[contains(text(),'${text}')] | //*[text()='${text}'][1]`;
    await this.world.page?.locator(selector).first().click();
  }

  async clickByExactText(text: string) {
    selector = `text=${text}`;
    await this.world.page?.locator(selector).first().click();
  }

  async getElementByText(text: string) {
    element = await this.world.page?.locator(`//*[text()='${text}'][1]`).first();
    return await element;
  }

  async getElementByTextInsideALogTab(text: string) {
    element = await this.world.page?.locator(`//*[not(self::th)][text()='${text}'][1]`).first();
    return await element;
  }

  async getElementByPartialText(text: string) {
    element = await this.world.page?.locator(`//*[contains(text(),'${text}')][1]`).first();
    return await element;
  }

  async getElementByPartialHref(partialHref: string) {
    element = await this.world.page?.locator(`//*[contains(@href,'${partialHref}')]`);
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async getElementByHrefAndText(partialHref: string, text: string) {
    element = await this.world.page?.locator(`//*[text()='${text}' and contains(@href,'${partialHref}')]`).first();
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async getElementById(id: string) {
    element = await this.world.page?.locator(`#${id}`);
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async getElementByTestId(testid: string) {
    element = await this.world.page?.locator(`${this.byTestId}${testid}`);
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async getElementByTitle(title: string) {
    element = await this.world.page?.locator(`//*[@title='${title}']`);
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async getElementByTestIdAndText(testid: string, text: string) {
    element = await this.world.page?.locator(`//*[@${this.byTestId}'${testid}' and contains(text(), '${text}')]`);
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async getNetworkLayer(testid: string, selectorType: string) {
    helper = new Helper(this.world);
    const dataLinkId = `//*[@class='transactions-data-link-network']`;

    if (selectorType === "byTestID") {
      selector = `//*[@${this.byTestId}'${testid}']/..${dataLinkId}`;
    } else if (selectorType === "byText") {
      selector = `//*[text()='${testid}']/../..${dataLinkId}`;
    }

    await helper.checkElementVisible(selector);
    const result = await helper.extractTextFromElement(selector);

    return result;
  }

  async getCustomNetworkLayer(element: string) {
    // This is the universal filter for any tet cases.
    // It uses 'I click on the first "<Artifact type>" link' element
    // in 'Page with part address "<url>" includes ID result' to set the layer.

    const slug_element = element.split("=").pop();
    //hint: just to filter L1/L2 layers in depend of tx/address
    //Debug on @id367

    if (slug_element === "from-address" || slug_element === "to-address") {
      return await this.getNetworkLayer(slug_element, "byTestID");
    } else if (
      //hint: for these types we should hardcoded L1 layer
      //Debug on @id241

      element.includes("Commit Tx hash") ||
      element.includes("Execute Tx hash") ||
      element.includes("Prove Tx hash")
    ) {
      return "L1";
    } else if (element.includes("Tokens Transferred")) {
      //hint: just to filter L1/L2 layers in depend of input
      //Debug on @id241

      return await this.getNetworkLayer("Tokens Transferred", "byText");
    }

    //hint: should be L2 in any other cases to use pageURL
    return "L2";
  }

  async getEtherscanDomain(networkType: string) {
    if (networkType.includes("goerli")) {
      return "https://goerli.etherscan.io"; // Testnet
    } else {
      return "https://etherscan.io"; // Mainnet
    }
  }

  async getUrlOfTheCurrentPage(
    networkLayer: string,
    pageURL: string,
    partRoute: string,
    result: string,
    networkType: string
  ) {
    const etherscanDomain = await this.getEtherscanDomain(networkType);

    if (networkLayer === "L1") {
      await this.world.page?.waitForTimeout(config.defaultTimeout.timeout);

      return [await this.world.context?.pages()[1].url(), etherscanDomain];
    } else {
      await this.world.page?.waitForURL(pageURL + partRoute + result);

      return [await this.world.page?.url(), pageURL];
    }
  }

  async getElement(selector: string) {
    element = await this.world.page?.locator(selector);
    await element.scrollIntoViewIfNeeded();
    return await element;
  }

  async returnElementByType(elementType: string, value: string) {
    if (elementType === "text") {
      element = await this.getElementByText(value);
    } else if (elementType === "partial text") {
      element = await this.getElementByPartialText(value);
    } else if (elementType === "partial href") {
      element = await this.getElementByPartialHref(value);
    } else if (elementType === "id") {
      element = await this.getElementById(value);
    } else if (elementType === "testId") {
      element = await this.getElementByTestId(value);
    } else if (elementType === "title") {
      element = await this.getElementByTitle(value);
    } else if (elementType === "log tab") {
      element = await this.getElementByTextInsideALogTab(value);
    }
    return element;
  }

  public async goTo(address: string) {
    await this.world.page?.goto(address);
  }
}
