import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Token, Values, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const bufferRoute = "src/playbook/";
const helper = new Helper();
let url: string;
let bufferFile;
let failedTxHash: string;
let contract: string;
let transaction: string;
let element: Locator;
let selector: string;

//@id1656
test("Verify failed tx", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.failedState;
  failedTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${failedTxHash}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=Failed`;
  element = await page.locator(selector);

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1655
test("Verify deployed the own ERC20 token contract", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.L2;
  contract = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/address/${contract}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1682
test(" Check on BE Transfer ETH token via Portal", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txEthWithdraw;
  transaction = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${transaction}` + BlockExplorer.localNetwork;

  await page.goto(url);
  //Check transaction hash
  selector = `text=${transaction}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address of sender
  selector = `text=${Wallets.richWalletAddress}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address of receiver
  selector = `text=${Token.ETHER_ERC20_Address}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);

  //Check transaction amount
  selector = `text=${Values.txSumETH}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1680
test(" Check on BE Transfer custom ERC-20 token via Portal", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txMultiTransferCustomTokenI;
  transaction = await helper.getStringFromFile(bufferFile);
  const bufferFileToAdress = bufferRoute + Buffer.L2;
  const adressTo = await helper.getStringFromFile(bufferFileToAdress);
  url = BlockExplorer.baseUrl + `/tx/${transaction}` + BlockExplorer.localNetwork;

  await page.goto(url);
  //Check transaction hash
  selector = `text=${transaction}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address of receiver
  selector = `text=${Wallets.richWalletAddress}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check address of receiver
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
  bufferFile = bufferRoute + Buffer.addressMultiTransferETH;
  contract = await helper.getStringFromFile(bufferFile);

  const bufferFileAddress = bufferRoute + Buffer.txMultiTransferETH;
  const txAddress = await helper.getStringFromFile(bufferFileAddress);
  url = BlockExplorer.baseUrl + `/address/${contract}` + BlockExplorer.localNetwork;

  await page.goto(url);
  //Check contract address
  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
  //Check transaction hash
  selector = `text=${txAddress}`;
  element = await page.locator(selector).first();
  await expect(element).toBeVisible(config.extraTimeout);
});
