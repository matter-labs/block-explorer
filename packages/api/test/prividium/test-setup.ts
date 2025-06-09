/**
 * Prividium Test Setup
 *
 * This file runs before each test to ensure the Prividium environment
 * is properly configured and isolated.
 */

import { setupPrividiumTestEnvironment } from "../prividium.env";

declare const beforeEach: any;
declare const jest: any;

// Ensure Prividium environment is set up before each test
beforeEach(() => {
  setupPrividiumTestEnvironment();
});

// Increase timeout for Prividium tests as they may involve more complex authentication flows
jest.setTimeout(30000);
