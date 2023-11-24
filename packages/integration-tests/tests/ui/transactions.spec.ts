import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer } from "../../src/entities";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const bufferRoute = "src/playbook/";
const helper = new Helper();
let url: string;
let bufferFile;
let failedTxHash: string;
let contract: string;
let element: Locator;
let selector: string;

//@id1656
test("Verify failed tx", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.failedState;
  failedTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/tx/${failedTxHash}`;

  await page.goto(url);
  await page.goto(targetUrl);

  element = await page.locator(`text=${failedTxHash}`).first();
  const failedStatus = await page.locator(`text=Failed`).first();

  await expect(failedStatus).toBeVisible(config.extraTimeout);
  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1655
test("Verify deployed the own ERC20 token contract", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.L2;
  contract = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/address/${contract}`;

  await page.goto(url);
  await page.goto(targetUrl);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible();
});
