import { expect, test } from "@playwright/test";

import { config } from "./config";
import { BlockExplorer, Buffer, Wallets } from "../../src/constants";
import { Helper } from "../../src/helper";

import type { Locator } from "@playwright/test";

const bufferRoute = "src/playbook/";
const helper = new Helper();
let url: string;
let bufferFile;
let depositTxHash: string;
let initiatorAddress: string;
let hash, initiatorAddressElement, ethValue, erc20Value: Locator;

//@id1660
test("Check Deposit ETH transaction on BE", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txEthDeposit;
  depositTxHash = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${depositTxHash}` + BlockExplorer.localNetwork;
  initiatorAddress = Wallets.richWalletAddress;

  await page.goto(url);

  hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${depositTxHash}"]`).first();
  initiatorAddressElement = await page.locator(`text=${initiatorAddress}`).first();
  ethValue = await page.locator(`text=0.0000001`).first();

  await expect(hash).toBeVisible(config.defaultTimeout);
  await expect(ethValue).toBeVisible(config.defaultTimeout);
  await expect(initiatorAddressElement).toBeVisible(config.defaultTimeout);
});

//@id1681
test("Check on BE Deposit the custom ERC-20 token", async ({ page }) => {
  bufferFile = bufferRoute + Buffer.txERC20Deposit;
  depositTxHash = await helper.readFile(bufferFile);
  url = BlockExplorer.baseUrl + `/tx/${depositTxHash}` + BlockExplorer.localNetwork;
  initiatorAddress = Wallets.richWalletAddress;

  await page.goto(url);

  hash = await page.locator(`//*[text()="Transaction Hash"]/..//..//*[text()="${depositTxHash}"]`).first();
  initiatorAddressElement = await page.locator(
    `//*[text()="From"]/..//*[text()="L1"]/..//*[text()="0x36615Cf349d...c049"]`
  );
  erc20Value = await page.locator(`//*[text()="0x36615Cf349d...c049"]/..//..//*[text()="100"]`);

  await expect(hash).toBeVisible(config.defaultTimeout);
  await expect(erc20Value).toBeVisible(config.defaultTimeout);
  await expect(initiatorAddressElement).toBeVisible(config.defaultTimeout);
});
