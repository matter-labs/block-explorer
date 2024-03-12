import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Path, Token, Values, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const helper = new Helper();
let url: string;
let failedTxHash: string;
let contract: string;
let transaction: string;
let element: Locator;
let elementTx: Locator;
let elementFrom: Locator;
let elementTo: Locator;
let elementContract: Locator;
let selector: string;

//@id1656
test("Verify failed tx", async ({ page }) => {
  failedTxHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.failedState);
  url = BlockExplorer.baseUrl + `/tx/${failedTxHash}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=Failed`;
  element = await page.locator(selector);

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1655
test("Verify deployed the own ERC20 token contract", async ({ page }) => {
  contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
  url = BlockExplorer.baseUrl + `/address/${contract}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1682
test(" Check on BE Transfer ETH token via Portal", async ({ page }) => {
  transaction = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdraw);
  url = BlockExplorer.baseUrl + `/tx/${transaction}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=${transaction}`;
  elementTx = await page.locator(selector).first();

  selector = `text=${Wallets.richWalletAddress}`;
  elementFrom = await page.locator(selector).first();

  selector = `text=${Token.ERC20AddressETH}`;
  elementTo = await page.locator(selector).first();

  selector = `text=${Values.txSumETH}`;
  element = await page.locator(selector).first();

  //Check tx Hash
  await expect(elementTx).toBeVisible(config.extraTimeout);
  //Check address From
  await expect(elementFrom).toBeVisible(config.extraTimeout);
  //Check address To
  await expect(elementTo).toBeVisible(config.extraTimeout);
  //Check transaction Amount
  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1680
test(" Check on BE Transfer custom ERC-20 token via Portal", async ({ page }) => {
  transaction = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenI);
  const adressTo = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
  url = BlockExplorer.baseUrl + `/tx/${transaction}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=${transaction}`;
  elementTx = await page.locator(selector).first();

  selector = `text=${Wallets.richWalletAddress}`;
  elementFrom = await page.locator(selector).first();

  selector = `text=${adressTo}`;
  elementTo = await page.locator(selector).first();

  //Check transaction amount
  selector = `text= 1 `;
  element = await page.locator(selector).first();

  //Check tx Hash
  await expect(elementTx).toBeVisible(config.extraTimeout);
  //Check address From
  await expect(elementFrom).toBeVisible(config.extraTimeout);
  //Check address To
  await expect(elementTo).toBeVisible(config.extraTimeout);
  //Check transaction Amount
  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1683
test("Check on BE contract that makes multiple transfers based on stored/retrieved ETH + ERC20", async ({ page }) => {
  contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);
  const txAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferETH);
  url = BlockExplorer.baseUrl + `/address/${contract}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  selector = `text=${txAddress}`;
  elementContract = await page.locator(selector).first();

  //Check contract Address
  await expect(element).toBeVisible(config.extraTimeout);
  //Check tx Hash
  await expect(element).toBeVisible(config.extraTimeout);
});
