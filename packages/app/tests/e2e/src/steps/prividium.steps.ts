import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import { setupAuthMocks, setupOAuthRedirectMock } from "../helpers/prividium-auth-mocks";
import { config } from "../support/config";

import type { ICustomWorld } from "../support/custom-world";

Given("I am an authorized user", async function (this: ICustomWorld) {
  // Set up all mocks before any navigation
  await setupAuthMocks(this.page!, { isAuthorized: true });
  await setupOAuthRedirectMock(this.page!);
});

Given("I am an unauthorized user", async function (this: ICustomWorld) {
  // Set up all mocks before any navigation
  await setupAuthMocks(this.page!, { isAuthorized: false });
  await setupOAuthRedirectMock(this.page!);
});

Given("I am on the login page", async function (this: ICustomWorld) {
  await this.page?.goto(config.BASE_URL + "/login");
  await this.page?.waitForLoadState("networkidle");
  expect(this.page?.url()).toContain(config.BASE_URL + "/login");
});

When("I click the login button", async function (this: ICustomWorld) {
  const connectButton = this.page!.getByRole("button", { name: "Login with Prividium" });
  await connectButton.click();
});

Then("I should see the main page", async function (this: ICustomWorld) {
  const mainHeading = this.page!.getByRole("heading", { name: "ZKsync Block Explorer" });
  await expect(mainHeading).toBeVisible({ timeout: 10000 });
});

Then("I should see the wallet status bar", async function (this: ICustomWorld) {
  const statusBar = this.page!.locator(".wallet-button .address-text");
  await expect(statusBar).toBeVisible();
});

When("I click the wallet status bar", async function (this: ICustomWorld) {
  const statusBar = this.page!.locator(".wallet-button .address-text");
  await statusBar.click();
});

Then("I should see the wallet info modal", async function (this: ICustomWorld) {
  const modalTitle = this.page!.getByText("Your wallet", { exact: true });
  await expect(modalTitle).toBeVisible();
});

When("I click the logout button", async function (this: ICustomWorld) {
  const logoutButton = this.page!.getByRole("button", { name: "Logout" });
  await logoutButton.click();
});

Then("I should be logged out", async function (this: ICustomWorld) {
  const loginHeading = this.page!.getByRole("heading", { name: "Private Explorer Access" });
  await expect(loginHeading).toBeVisible();
});

Then("I should see the not authorized page", async function (this: ICustomWorld) {
  const unauthorizedHeading = this.page!.getByRole("heading", { name: "You are not authorized" });
  await expect(unauthorizedHeading).toBeVisible();
  expect(this.page?.url()).toContain("/not-authorized");
});

Then("I should see the switch network button in the wallet info modal", async function (this: ICustomWorld) {
  const switchNetworkButton = this.page!.locator("button.switch-network-ui-btn", { hasText: "Switch to Prividium" });
  await expect(switchNetworkButton).toBeVisible();
});
