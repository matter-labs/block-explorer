import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import { config } from "../support/config";

import type { ICustomWorld } from "../support/custom-world";

Given("I am on the login page", async function (this: ICustomWorld) {
  expect(this.page?.url()).toContain(config.BASE_URL + "/login");
});

When("I click the connect wallet button", async function (this: ICustomWorld) {
  const connectButton = this.page!.getByRole("button", { name: "Connect wallet" });
  await connectButton.click();
});

When("I sign the message to log in", async function (this: ICustomWorld) {
  await this.metamask!.signin();
});

Then("I should see the main page", async function (this: ICustomWorld) {
  const mainHeading = this.page!.getByRole("heading", { name: "ZKsync Era Block Explorer" });
  await expect(mainHeading).toBeVisible({ timeout: 10000 });
});

Then("I should see the wallet status bar", async function (this: ICustomWorld) {
  const statusBar = this.page!.locator(".metamask-button .address-text");
  await expect(statusBar).toBeVisible();
});

When("I click the wallet status bar", async function (this: ICustomWorld) {
  const statusBar = this.page!.locator(".metamask-button .address-text");
  await statusBar.click();
});

Then("I should see the wallet info modal", async function (this: ICustomWorld) {
  const modalTitle = this.page!.getByText("Your wallet", { exact: true });
  await expect(modalTitle).toBeVisible();
});

When("I click the disconnect button", async function (this: ICustomWorld) {
  const disconnectButton = this.page!.getByRole("button", { name: "Disconnect" });
  await disconnectButton.click();
});

Then("I should be logged out", async function (this: ICustomWorld) {
  const loginHeading = this.page!.getByRole("heading", { name: "Private Explorer Access" });
  await expect(loginHeading).toBeVisible();
});

Then("I should see the network switch", async function (this: ICustomWorld) {
  const networkSwitch = this.page!.locator(".network-switch");
  await expect(networkSwitch).toBeVisible();
});

When("I click the network switch", async function (this: ICustomWorld) {
  const networkSwitch = this.page!.locator(".network-switch .toggle-button");
  await networkSwitch.click();
});

Then("I should see a list of available networks", async function (this: ICustomWorld) {
  const networkList = this.page!.locator(".network-list");
  await expect(networkList).toBeVisible();
});

Then("I should see the wrong network indicator", async function (this: ICustomWorld) {
  const wrongNetwork = this.page!.getByText("Wrong network", { exact: true });
  await expect(wrongNetwork).toBeVisible();
});

Then("I should see the switch network button in the wallet info modal", async function (this: ICustomWorld) {
  const switchNetworkButton = this.page!.locator("button.switch-network-ui-btn", { hasText: "Switch to Prividium" });
  await expect(switchNetworkButton).toBeVisible();
});
