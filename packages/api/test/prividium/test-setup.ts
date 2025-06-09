/**
 * Prividium Test Setup
 *
 * This file runs before each test to ensure the Prividium environment
 * is properly configured and isolated.
 */

import { setupPrividiumTestEnvironment } from "../prividium.env";

declare const jest: any;

// Set up Prividium environment immediately when this module is loaded
// This must happen BEFORE any other modules import the config
setupPrividiumTestEnvironment();

// Increase timeout for Prividium tests as they may involve more complex authentication flows
jest.setTimeout(30000);
