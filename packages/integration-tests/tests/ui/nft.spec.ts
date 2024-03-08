import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Path } from "../../src/constants";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const helper = new Helper();
let url: string;
let contract: string;
let element: Locator;

//@id1658
test("Check the L2 NFT contract address", async ({ page }) => {
  contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.NFTtoL2);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/address/${contract}`;

  await page.goto(url);
  await page.goto(targetUrl);

  element = await page.locator(`text=${contract}`).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1657
test("Check the L1 NFT contract address", async ({ page }) => {
  contract = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.NFTtoL1);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/address/${contract}`;

  await page.goto(url);
  await page.goto(targetUrl);

  element = await page.locator(`text=${contract}`).first();
  const noTransactionNotification = await page.locator(`text=This account doesn’t have any transactions`).first();

  await expect(element).toBeVisible(config.extraTimeout);
  await expect(noTransactionNotification).toBeVisible(config.extraTimeout);
});
