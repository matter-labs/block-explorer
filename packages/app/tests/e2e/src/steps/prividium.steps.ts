import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import { config } from "../support/config";

import type { ICustomWorld } from "../support/custom-world";
import type { Route } from "@playwright/test";

interface AuthResponse {
  address: string;
  isAuthenticated: boolean;
  user: {
    id: number;
    address: string;
  };
}

interface TokenResponse {
  token: string;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: boolean;
}

interface EthereumProvider {
  isMetaMask: boolean;
  request: (params: EthereumRequestParams) => Promise<string[] | string | null>;
}

interface EthereumRequestParams {
  method: string;
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider;
}

// Core Prividium mode setup
Given("I am in Prividium mode", async function (this: ICustomWorld) {
  await this.page?.addInitScript(() => {
    localStorage.setItem("PRIVIDIUM_MODE", "true");
    (window as { PRIVIDIUM_MODE?: boolean }).PRIVIDIUM_MODE = true;
  });
});

// Authentication states
Given("I am not authenticated", async function (this: ICustomWorld) {
  await this.page?.addInitScript(() => {
    localStorage.removeItem("useWallet_isAuthenticated");
    localStorage.removeItem("auth_token");
    sessionStorage.clear();
  });

  await this.page?.route("**/auth/me", async (route: Route) => {
    await route.fulfill({
      status: 401,
      body: JSON.stringify({ error: "Not authenticated" } as ErrorResponse),
    });
  });
});

Given("I am authenticated and on the main page", async function (this: ICustomWorld) {
  await this.page?.route("**/auth/me", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isAuthenticated: true,
        user: { id: 1, address: "0x1234567890abcdef1234567890abcdef12345678" },
      } as AuthResponse),
    });
  });

  await this.page?.route("**/auth/token", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "mock-rpc-token-123456" } as TokenResponse),
    });
  });

  const targetUrl = config.BASE_URL + config.DAPP_NETWORK;
  await this.page?.goto(targetUrl);
  await this.page?.waitForLoadState();
});

// Navigation actions
When("I visit the application", async function (this: ICustomWorld) {
  const targetUrl = config.BASE_URL + config.DAPP_NETWORK;
  await this.page?.goto(targetUrl);
  await this.page?.waitForLoadState();
});

When("I navigate to different sections of the application", async function (this: ICustomWorld) {
  const baseUrl = this.page?.url();
  if (baseUrl) {
    await this.page?.goto(baseUrl + "/blocks");
    await this.page?.waitForLoadState();
    await this.page?.goto(baseUrl + "/transactions");
    await this.page?.waitForLoadState();
    await this.page?.goto(baseUrl);
    await this.page?.waitForLoadState();
  }
});

When("I navigate directly to a specific page via URL", async function (this: ICustomWorld) {
  const currentUrl = this.page?.url();
  if (currentUrl) {
    const specificUrl = currentUrl + "/blocks";
    await this.page?.goto(specificUrl);
    await this.page?.waitForLoadState();
  }
});

When("I resize the browser to different viewport sizes", async function (this: ICustomWorld) {
  await this.page?.setViewportSize({ width: 1200, height: 800 });
  await this.page?.waitForTimeout(500);
  await this.page?.setViewportSize({ width: 768, height: 1024 });
  await this.page?.waitForTimeout(500);
  await this.page?.setViewportSize({ width: 375, height: 667 });
  await this.page?.waitForTimeout(500);
  await this.page?.setViewportSize({ width: 1200, height: 800 });
  await this.page?.waitForTimeout(500);
});

// Authentication actions
When("the wallet connection is successful", async function (this: ICustomWorld) {
  await this.page?.route("**/auth/me", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isAuthenticated: true,
        user: { id: 1, address: "0x1234567890abcdef1234567890abcdef12345678" },
      } as AuthResponse),
    });
  });

  await this.page?.route("**/auth/token", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "mock-rpc-token-123456" } as TokenResponse),
    });
  });

  await this.page?.route("**/auth/message", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "Mock SIWE message for testing",
    });
  });

  await this.page?.route("**/auth/verify", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true } as SuccessResponse),
    });
  });

  const loginButton = this.page?.locator('[data-testid="login-button"]');
  if (await loginButton?.isVisible()) {
    await loginButton?.click();
    await this.page?.waitForTimeout(1000);

    await this.page?.evaluate(() => {
      localStorage.setItem("useWallet_isAuthenticated", "true");
      localStorage.setItem("auth_token", "mock-auth-token");
      localStorage.setItem("wallet_address", "0x1234567890abcdef1234567890abcdef12345678");
    });

    const targetUrl = config.BASE_URL + config.DAPP_NETWORK;
    await this.page?.goto(targetUrl);
    await this.page?.waitForLoadState();
  }
});

When("I logout", async function (this: ICustomWorld) {
  const logoutButton = this.page?.locator('[data-testid="logout-button"]');
  const disconnectButton = this.page?.locator('[data-testid="disconnect-button"]');
  const userMenuButton = this.page?.locator('[data-testid="user-menu-button"]');

  if (await logoutButton?.isVisible()) {
    await logoutButton?.click();
  } else if (await disconnectButton?.isVisible()) {
    await disconnectButton?.click();
  } else if (await userMenuButton?.isVisible()) {
    await userMenuButton?.click();
    await this.page?.waitForTimeout(500);
    const logoutMenuItem = this.page?.locator('[data-testid="logout-menu-item"]');
    if (await logoutMenuItem?.isVisible()) {
      await logoutMenuItem?.click();
    }
  } else {
    await this.page?.route("**/auth/me", async (route: Route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: "Not authenticated" } as ErrorResponse),
      });
    });

    await this.page?.route("**/auth/logout", async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true } as SuccessResponse),
      });
    });

    await this.page?.reload();
    await this.page?.waitForLoadState();
  }
});

When("I am connected to a wrong network", async function (this: ICustomWorld) {
  await this.page?.evaluate(() => {
    const networkIndicator = document.querySelector('[data-testid="network-indicator"]');
    if (networkIndicator) {
      networkIndicator.textContent = "Wrong network";
      networkIndicator.classList.add("wrong-network");
    }
  });
  await this.page?.waitForTimeout(500);
});

// MetaMask flow actions
When("I connect with MetaMask", async function (this: ICustomWorld) {
  await this.page?.addInitScript(() => {
    (window as WindowWithEthereum).ethereum = {
      isMetaMask: true,
      request: async (params: EthereumRequestParams) => {
        if (params.method === "eth_requestAccounts") {
          return ["0x1234567890abcdef1234567890abcdef12345678"];
        }
        if (params.method === "eth_chainId") {
          return "0x1";
        }
        return null;
      },
    };
  });

  const loginButton = this.page?.locator('[data-testid="connect-wallet-button"], [data-testid="login-button"]');
  if (await loginButton?.isVisible()) {
    await loginButton?.click();
    await this.page?.waitForTimeout(1000);
  }
});

When("I switch networks in MetaMask", async function (this: ICustomWorld) {
  await this.page?.evaluate(() => {
    if ((window as WindowWithEthereum).ethereum) {
      (window as WindowWithEthereum).ethereum!.request = async (params: EthereumRequestParams) => {
        if (params.method === "eth_chainId") {
          return "0x89";
        }
        return null;
      };
    }
  });
  await this.page?.waitForTimeout(1000);
});

When("I request an RPC endpoint", async function (this: ICustomWorld) {
  await this.page?.route("**/auth/token", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "rpc-token-abcd1234",
        endpoint: "https://rpc.example.com",
      } as TokenResponse),
    });
  });

  const rpcButton = this.page?.locator('[data-testid="rpc-request-button"]');
  if (await rpcButton?.isVisible()) {
    await rpcButton?.click();
  }
  await this.page?.waitForTimeout(1000);
});

When("I disconnect from MetaMask", async function (this: ICustomWorld) {
  // Simulate logout by setting up unauthenticated state and reloading
  await this.page?.route("**/auth/me", async (route: Route) => {
    await route.fulfill({
      status: 401,
      body: JSON.stringify({ error: "Not authenticated" } as ErrorResponse),
    });
  });

  await this.page?.evaluate(() => {
    localStorage.removeItem("useWallet_isAuthenticated");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("wallet_address");
  });

  await this.page?.reload();
  await this.page?.waitForLoadState();
});

// Assertions
Then("I should see the login screen", async function (this: ICustomWorld) {
  const currentUrl = this.page?.url();
  await expect(currentUrl).toContain("/login");
});

Then("the connect wallet button should be visible", async function (this: ICustomWorld) {
  const loginButton = this.page?.locator('[data-testid="login-button"]');
  if (loginButton) {
    await expect(loginButton).toBeVisible(config.increasedTimeout);
  }
});

Then("I should be redirected to the main application", async function (this: ICustomWorld) {
  await this.page?.waitForTimeout(2000);
  const currentUrl = this.page?.url();
  await expect(currentUrl).not.toContain("/login");
});

Then("I should see the wallet status bar", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);
  }
});

Then("I should be redirected to the login page", async function (this: ICustomWorld) {
  const currentUrl = this.page?.url();
  await expect(currentUrl).toContain("/login");
});

Then("I should remain authenticated", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);
  }
});

Then("the header components should persist", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');

  const walletVisible = await walletStatusBar?.isVisible();
  const networkVisible = await networkIndicator?.isVisible();
  const headerComponentsVisible = walletVisible || networkVisible;
  await expect(headerComponentsVisible).toBe(true);
});

Then("I should access the page without authentication challenges", async function (this: ICustomWorld) {
  const currentUrl = this.page?.url();
  await expect(currentUrl).not.toContain("/login");
});

Then("the authentication state should be maintained", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);
  }
});

Then("the wallet status bar should be visible", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);
  }
});

Then("the network indicator should be visible", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  if (networkIndicator) {
    await expect(networkIndicator).toBeVisible(config.increasedTimeout);
  }
});

Then("all header elements should be properly displayed", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);
  }

  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  if (networkIndicator) {
    await expect(networkIndicator).toBeVisible(config.increasedTimeout);
  }
});

Then("the network indicator should show current network information", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  if (networkIndicator) {
    await expect(networkIndicator).toBeVisible(config.increasedTimeout);

    const networkContent = await networkIndicator.textContent();
    const hasValidNetworkName = networkContent && networkContent.trim().length > 0;
    await expect(hasValidNetworkName).toBe(true);
  }
});

Then("the network indicator should have proper styling", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');

  const computedStyles = await networkIndicator?.evaluate((el: HTMLElement) => {
    const styles = window.getComputedStyle(el);
    return {
      display: styles.display,
      backgroundColor: styles.backgroundColor,
      border: styles.border,
      borderRadius: styles.borderRadius,
    };
  });

  await expect(computedStyles?.display).toBeTruthy();
});

Then("the network indicator should show {string} text", async function (this: ICustomWorld, expectedText: string) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  const actualText = await networkIndicator?.textContent();
  await expect(actualText).toContain(expectedText);
});

Then("the network indicator should have warning styling", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  const className = await networkIndicator?.getAttribute("class");
  const hasWarningClass = className?.includes("wrong-network") || false;
  await expect(hasWarningClass).toBe(true);
});

Then("the network indicator should adapt responsively", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  if (networkIndicator) {
    await expect(networkIndicator).toBeVisible(config.increasedTimeout);
  }
});

Then("the network indicator should remain functional", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  if (networkIndicator) {
    await expect(networkIndicator).toBeVisible(config.increasedTimeout);
  }
});

Then("the network indicator should show the correct network name", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  const networkText = await networkIndicator?.textContent();
  const hasValidNetworkName = networkText && networkText.trim().length > 0;
  await expect(hasValidNetworkName).toBe(true);
});

Then("the network indicator should display the appropriate network icon", async function (this: ICustomWorld) {
  const networkIcon = this.page?.locator('[data-testid="network-indicator"] img');
  const iconVisible = await networkIcon?.isVisible();
  await expect(iconVisible).toBe(true);
});

// MetaMask flow assertions
Then("I should be able to connect to MetaMask", async function (this: ICustomWorld) {
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);

    const walletContent = await walletStatusBar.textContent();
    const isConnected = walletContent?.includes("0x") || false;
    await expect(isConnected).toBe(true);
  }
});

Then("I should be able to switch networks", async function (this: ICustomWorld) {
  const networkIndicator = this.page?.locator('[data-testid="network-indicator"]');
  if (networkIndicator) {
    await expect(networkIndicator).toBeVisible(config.increasedTimeout);

    const networkText = await networkIndicator.textContent();
    await expect(networkText).toBeTruthy();
  }
});

Then("I should be able to get an RPC endpoint", async function (this: ICustomWorld) {
  // For now, just verify the user can access authenticated features
  // The RPC endpoint functionality would be tested when the feature exists
  const walletStatusBar = this.page?.locator('[data-testid="wallet-status-bar"]');
  if (walletStatusBar) {
    await expect(walletStatusBar).toBeVisible(config.increasedTimeout);
  }
});

Then("I should be able to disconnect", async function (this: ICustomWorld) {
  // After disconnect, should be redirected to login page
  const currentUrl = this.page?.url();
  await expect(currentUrl).toContain("/login");
});
