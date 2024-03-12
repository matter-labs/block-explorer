import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Path } from "../../src/constants";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const helper = new Helper();
let url: string;
let failedTxHash: string;
let contract: string;
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
