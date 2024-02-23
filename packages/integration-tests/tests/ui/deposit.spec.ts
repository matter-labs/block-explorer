import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";

const bufferRoute = "src/playbook/";
const helper = new Helper();
let url: string;
let bufferFile;
let depositTxHash: string;
let fromAddress: string;

//@id1660
test("Check Deposit ETH transaction on BE", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txEthDeposit;
  depositTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${depositTxHash}` + BlockExplorer.localNetwork;
  fromAddress = Wallets.richWalletAddress;
  console.log(url);

  await page.goto(url);

  const hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${depositTxHash}"]`).first();
  const fromAddressElement = await page.locator(`text=${fromAddress}`).first();
  const ethValue = await page.locator(`text=0.0000001`).first();

  await expect(hash).toBeVisible(config.extraTimeout);
  await expect(ethValue).toBeVisible(config.extraTimeout);
  await expect(fromAddressElement).toBeVisible(config.extraTimeout);
});

//@id1681
test("Check on BE Deposit the custom ERC-20 token", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txERC20Deposit;
  depositTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${depositTxHash}` + BlockExplorer.localNetwork;
  fromAddress = Wallets.richWalletAddress;
  console.log(url);

  await page.goto(url);

  const hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${depositTxHash}"]`).first();
  const fromAddressElement = await page.locator(
    `//*[text()="From"]/..//*[text()="L1"]/..//*[text()="0x36615Cf349d...c049"]`
  );
  const erc20Value = await page.locator(`//*[text()="0x36615Cf349d...c049"]/..//..//*[text()="100"]`);

  await expect(hash).toBeVisible(config.extraTimeout);
  await expect(erc20Value).toBeVisible(config.extraTimeout);
  await expect(fromAddressElement).toBeVisible(config.extraTimeout);
});
