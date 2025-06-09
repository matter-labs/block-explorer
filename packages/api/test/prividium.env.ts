/**
 * Prividium Test Environment Configuration
 *
 * This file programmatically sets up environment variables for Prividium API testing.
 * It ensures complete isolation from regular tests and proper Prividium mode configuration.
 */

declare const process: any;

export const setupPrividiumTestEnvironment = () => {
  // Prividium configuration
  process.env.PRIVIDIUM = "true";

  // Database configuration - isolated database for Prividium tests
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prividium_test_db";

  // Server configuration - different ports to avoid conflicts
  process.env.METRICS_PORT = "3015";
  process.env.PORT = "3017";

  // Session configuration for authentication testing
  process.env.SESSION_SECRET = "prividium-test-secret-key-for-testing";
  process.env.PRIVIDIUM_SESSION_MAX_AGE = "86400000"; // 24 hours
  process.env.PRIVIDIUM_SESSION_SAME_SITE = "lax";
  process.env.APP_URL = "http://localhost:3010";

  // Prividium specific configuration
  process.env.PRIVIDIUM_PRIVATE_RPC_URL = "http://localhost:3050/rpc";
  process.env.PRIVIDIUM_PRIVATE_RPC_SECRET = "test-private-rpc-secret";
  process.env.PRIVIDIUM_CHAIN_ID = "324"; // zkSync Era testnet

  // API pagination limits
  process.env.LIMITED_PAGINATION_MAX_ITEMS = "15";
  process.env.API_LIMITED_PAGINATION_MAX_ITEMS = "15";

  // Contract verification
  process.env.CONTRACT_VERIFICATION_API_URL = "http://verification.api";

  // Base token configuration
  process.env.BASE_TOKEN_SYMBOL = "ETH";
  process.env.BASE_TOKEN_DECIMALS = "18";
  process.env.BASE_TOKEN_L1_ADDRESS = "0x0000000000000000000000000000000000000000";
  process.env.BASE_TOKEN_ICON_URL = "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698873266";
  process.env.BASE_TOKEN_NAME = "Ether";
  process.env.BASE_TOKEN_LIQUIDITY = "220000000000";
  process.env.BASE_TOKEN_USDPRICE = "1800";
  process.env.ETH_TOKEN_L2_ADDRESS = "0x000000000000000000000000000000000000800A";

  // Node environment
  process.env.NODE_ENV = "test";
};

/**
 * Validates that all required Prividium environment variables are set
 */
export const validatePrividiumEnvironment = () => {
  const requiredVars = [
    "PRIVIDIUM",
    "DATABASE_URL",
    "PRIVIDIUM_PRIVATE_RPC_URL",
    "PRIVIDIUM_PRIVATE_RPC_SECRET",
    "PRIVIDIUM_CHAIN_ID",
    "PRIVIDIUM_SESSION_MAX_AGE",
    "APP_URL",
    "SESSION_SECRET",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required Prividium environment variables: ${missing.join(", ")}`);
  }

  if (process.env.PRIVIDIUM !== "true") {
    throw new Error('PRIVIDIUM environment variable must be set to "true" for Prividium tests');
  }

  if (!process.env.DATABASE_URL?.includes("prividium_test_db")) {
    throw new Error("DATABASE_URL must point to prividium_test_db for proper test isolation");
  }
};
