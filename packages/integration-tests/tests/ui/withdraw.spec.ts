import { expect, test } from "@playwright/test";

import { BlockExplorer, Buffer, Path, Values, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const helper = new Helper();
let url: string;
let withdrawTxHash: string;
let initiatorAddress: string;
let hash, initiatorAddressElement, toAddressElement, ethValue, erc20Value: Locator;

//@id1661
test("Check Withdraw ETH transaction on BE", async ({ page }) => {
  withdrawTxHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdraw);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  initiatorAddress = Wallets.richWalletAddress;

  await page.goto(url);

  hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  initiatorAddressElement = await page.locator(`text=${initiatorAddress}`).first();
  toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x36615Cf349d...c049"]`)
    .first();
  ethValue = await page.locator(`text=${Values.txSumETH}`).first();

  await expect(hash).toBeVisible();
  await expect(ethValue).toBeVisible();
  await expect(initiatorAddressElement).toBeVisible();
  await expect(toAddressElement).toBeVisible();
});

//@id1686
test("Verify the ETH withdrawal to the other address", async ({ page }) => {
  withdrawTxHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txEthWithdrawOtherAddress);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  initiatorAddress = Wallets.richWalletAddress;

  await page.goto(url);

  hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  initiatorAddressElement = await page.locator(`text=${initiatorAddress}`).first();
  toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x586607935E1...8975"]`)
    .first();
  ethValue = await page.locator(`text=${Values.txSumETH}`).first();

  await expect(hash).toBeVisible();
  await expect(ethValue).toBeVisible();
  await expect(initiatorAddressElement).toBeVisible();
  await expect(toAddressElement).toBeVisible();
});

//@id1685
test("Check on BE Withdraw the custom ERC-20 via Portal", async ({ page }) => {
  withdrawTxHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txERC20Withdraw);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  initiatorAddress = Wallets.richWalletAddress;

  await page.goto(url);

  hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  initiatorAddressElement = await page.locator(`text=${initiatorAddress}`).first();
  toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x36615Cf349d...c049"]`)
    .first();
  erc20Value = await page.locator(`//*[text()="0x36615Cf349d...c049"]/..//..//*[text()="0.2"]`).first();

  await expect(hash).toBeVisible();
  await expect(erc20Value).toBeVisible();
  await expect(initiatorAddressElement).toBeVisible();
  await expect(toAddressElement).toBeVisible();
});

//@id1664
test("Check Withdraw transaction on BE for custom ERC-20 token to a different address", async ({ page }) => {
  withdrawTxHash = await helper.readFile(Path.absolutePathToBufferFiles, Buffer.txERC20WithdrawOtherAddress);
  url = BlockExplorer.baseUrl + `/tx/${withdrawTxHash}` + BlockExplorer.localNetwork;
  initiatorAddress = Wallets.richWalletAddress;

  await page.goto(url);

  hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${withdrawTxHash}"]`).first();
  initiatorAddressElement = await page.locator(`text=${initiatorAddress}`).first();
  toAddressElement = await page
    .locator(`//*[text()="To"]/..//..//..//*[text()="L1"]/..//*[text()="0x586607935E1...8975"]`)
    .first();
  erc20Value = await page.locator(`//*[text()="0x586607935E1...8975"]/..//..//*[text()="0.2"]`).first();

  await expect(hash).toBeVisible();
  await expect(erc20Value).toBeVisible();
  await expect(initiatorAddressElement).toBeVisible();
  await expect(toAddressElement).toBeVisible();
});
