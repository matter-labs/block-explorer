import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer } from "../../src/constants";
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
  failedTxHash = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${failedTxHash}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=Failed`;
  element = await page.locator(selector);

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1655
test("Verify deployed the own ERC20 token contract", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.L2;
  contract = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + `/address/${contract}` + BlockExplorer.localNetwork;

  await page.goto(url);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});
