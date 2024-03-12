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
  //Check tx Hash
  selector = `text=${transaction}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address From
  selector = `text=${Wallets.richWalletAddress}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address To
  selector = `text=${Token.ERC20AddressETH}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);

  //Check transaction Amount
  selector = `text=${Values.txSumETH}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1680
test(" Check on BE Transfer custom ERC-20 token via Portal", async ({ page }) => {
  transaction = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferCustomTokenI);
  const adressTo = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.L2);
  url = BlockExplorer.baseUrl + `/tx/${transaction}` + BlockExplorer.localNetwork;

  await page.goto(url);
  //Check tx Hash
  selector = `text=${transaction}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address From
  selector = `text=${Wallets.richWalletAddress}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address To
  selector = `text=${adressTo}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);

  //Check transaction amount
  selector = `text= 1 `;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1683
test("Check on BE contract that makes multiple transfers based on stored/retrieved ETH + ERC20", async ({ page }) => {
  //contract address
  contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.addressMultiTransferETH);
  //tx hash from deployed contract
  const txAddress = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txMultiTransferETH);
  url = BlockExplorer.baseUrl + `/address/${contract}` + BlockExplorer.localNetwork;

  await page.goto(url);
  //Check contract address
  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check tx hash
  selector = `text=${txAddress}`;
  element = await page.locator(selector).first();
});
