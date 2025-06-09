#!/usr/bin/env node

/**
 * Simple script to test Prividium test configuration
 * This can be run independently to verify environment setup
 */

const path = require("path");

// Import the environment setup (using require for Node.js compatibility)
const { setupPrividiumTestEnvironment, validatePrividiumEnvironment } = require("./prividium.env.ts");

console.log("🧪 Testing Prividium Test Configuration...\n");

try {
  // Setup environment
  console.log("⚙️  Setting up Prividium test environment...");
  setupPrividiumTestEnvironment();

  // Validate environment
  console.log("✅ Validating environment configuration...");
  validatePrividiumEnvironment();

  console.log("\n🎉 Prividium test infrastructure setup complete!");
  console.log("\nEnvironment variables configured:");
  console.log(`- PRIVIDIUM: ${process.env.PRIVIDIUM}`);
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL}`);
  console.log(`- PORT: ${process.env.PORT}`);
  console.log(`- METRICS_PORT: ${process.env.METRICS_PORT}`);
  console.log(`- APP_URL: ${process.env.APP_URL}`);

  console.log("\n🚀 Ready to run Prividium tests with:");
  console.log("   npm run test:e2e -- --config=test/jest-prividium.json");
} catch (error) {
  console.error("❌ Prividium test configuration failed:", error.message);
  process.exit(1);
}
