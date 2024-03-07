import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer } from "../../src/constants";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const bufferRoute = "src/playbook/";
const helper = new Helper();
let url: string;
let bufferFile;
let contract: string;
let element: Locator;
let selector: string;

//@id1684
test("Check Multicall - Caller contract address", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.addressMultiCallCaller;
  contract = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/address/${contract}`;

  await page.goto(url);
  await page.goto(targetUrl);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible(config.extraTimeout);
});

//@id1690
test("Check Multicall - Middle contract address", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.addressMultiCallMiddle;
  contract = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/address/${contract}`;

  await page.goto(url);
  await page.goto(targetUrl);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible();
});

//@id1691
test("Check Multicall - Root contract address", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.addressMultiCallRoot;
  contract = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + BlockExplorer.localNetwork;
  const targetUrl = BlockExplorer.baseUrl + `/address/${contract}`;

  await page.goto(url);
  await page.goto(targetUrl);

  selector = `text=${contract}`;
  element = await page.locator(selector).first();

  await expect(element).toBeVisible();
});
