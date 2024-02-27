import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Token, Wallets } from "../../src/entities";
import { Helper } from "../../src/helper";

const bufferRoute = "src/playbook/";
const helper = new Helper();
let url: string;
let bufferFile;
let withdrawTxHash: string;
let fromAddress: string;
let toAddress: string;

//@id1661
test("Check Withdraw ETH transaction on BE", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txEthWithdraw;
  withdrawTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  fromAddress = Wallets.richWalletAddress;
  console.log(url);

  await page.goto(url);

  const hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  const fromAddressElement = await page.locator(`text=${fromAddress}`).first();
  const toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x36615Cf349d...c049"]`)
    .first();
  const ethValue = await page.locator(`text=0.000009`).first();

  await expect(hash).toBeVisible(config.extraTimeout);
  await expect(ethValue).toBeVisible(config.extraTimeout);
  await expect(fromAddressElement).toBeVisible(config.extraTimeout);
  await expect(toAddressElement).toBeVisible(config.extraTimeout);
});

//@id1686
test("Verify the ETH withdrawal to the other address", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txEthWithdrawOtherAddress;
  withdrawTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  fromAddress = Wallets.richWalletAddress;
  console.log(url);

  await page.goto(url);

  const hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  const fromAddressElement = await page.locator(`text=${fromAddress}`).first();
  const toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x586607935E1...8975"]`)
    .first();
  const ethValue = await page.locator(`text=0.000009`).first();

  await expect(hash).toBeVisible(config.extraTimeout);
  await expect(ethValue).toBeVisible(config.extraTimeout);
  await expect(fromAddressElement).toBeVisible(config.extraTimeout);
  await expect(toAddressElement).toBeVisible(config.extraTimeout);
});

//@id1685
test("Check on BE Withdraw the custom ERC-20 via Portal", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txERC20Withdraw;
  withdrawTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  fromAddress = Wallets.richWalletAddress;
  console.log(url);

  await page.goto(url);

  const hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  const fromAddressElement = await page.locator(`text=${fromAddress}`).first();
  const toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x36615Cf349d...c049"]`)
    .first();
  const erc20Value = await page.locator(`//*[text()="0x36615Cf349d...c049"]/..//..//*[text()="0.2"]`).first();

  await expect(hash).toBeVisible(config.extraTimeout);
  await expect(erc20Value).toBeVisible(config.extraTimeout);
  await expect(fromAddressElement).toBeVisible(config.extraTimeout);
  await expect(toAddressElement).toBeVisible(config.extraTimeout);
});

//@id1664
test("Check Withdraw transaction on BE for custom ERC-20 token to a different address", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txERC20WithdrawOtherAddress;
  withdrawTxHash = await helper.getStringFromFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  fromAddress = Wallets.richWalletAddress;
  console.log(url);

  await page.goto(url);

  const hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  const fromAddressElement = await page.locator(`text=${fromAddress}`).first();
  const toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x586607935E1...8975"]`)
    .first();
  const erc20Value = await page.locator(`//*[text()="0x586607935E1...8975"]/..//..//*[text()="0.2"]`).first();

  await expect(hash).toBeVisible(config.extraTimeout);
  await expect(erc20Value).toBeVisible(config.extraTimeout);
  await expect(fromAddressElement).toBeVisible(config.extraTimeout);
  await expect(toAddressElement).toBeVisible(config.extraTimeout);
});
