/**
 * Prividium Test Authentication Utilities
 *
 * This file provides utilities for testing authentication flows in Prividium mode,
 * including SIWE (Sign-In with Ethereum) message generation and session management.
 */

import { calculateSiwe } from "../utils/siwe-message-tools";

declare const process: any;
declare const Buffer: any;

/**
 * Generate a test wallet address for Prividium testing
 */
export const generateTestAddress = (): string => {
  // Generate a deterministic test address based on current timestamp for uniqueness
  const timestamp = Date.now().toString();
  const hash = Buffer.from(timestamp).toString("hex").padStart(40, "0");
  return `0x${hash.slice(0, 40)}`;
};

/**
 * Create a SIWE message for testing authentication
 */
export const createTestSiweMessage = async (
  privateKey: string
): Promise<{
  msg: string;
  signature: string;
  address: string;
}> => {
  const domain = new URL(process.env.APP_URL || "http://localhost:3010").hostname;

  const result = await calculateSiwe({
    privateKey,
    domain,
    chainId: 324, // zkSync Era mainnet chain ID for testing
    nonce: Math.random().toString(36).substring(2, 15),
  });

  return {
    msg: result.msg,
    signature: result.signature,
    address: result.address,
  };
};

/**
 * Mock session data for authenticated requests
 */
export const createMockSession = (address: string) => {
  return {
    siwe: {
      address,
      domain: new URL(process.env.APP_URL || "http://localhost:3010").hostname,
      statement: "Sign in to ZKsync Era Block Explorer",
      uri: process.env.APP_URL || "http://localhost:3010",
      version: "1",
      chainId: 324,
      nonce: Math.random().toString(36).substring(2, 15),
      issuedAt: new Date().toISOString(),
    },
    verified: true,
  };
};

/**
 * Test private keys and addresses for different scenarios
 */
export const TEST_WALLET_DATA = {
  // A test wallet that should have access to private data
  AUTHENTICATED_USER: {
    privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234",
    address: "0x1234567890123456789012345678901234567890",
  },

  // A test wallet that should not have access to certain private data
  UNAUTHORIZED_USER: {
    privateKey: "0x9876543210987654321098765432109876543210987654321098765432109876",
    address: "0x0987654321098765432109876543210987654321",
  },
} as const;

/**
 * Test contract addresses
 */
export const TEST_ADDRESSES = {
  // Contract addresses for testing
  TEST_CONTRACT: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",

  // Token contract address
  TEST_TOKEN: "0xfedcbafedcbafedcbafedcbafedcbafedcbafed",
} as const;

/**
 * Helper to create authenticated request headers
 */
export const createAuthHeaders = (session: any) => {
  return {
    Cookie: `session=${encodeURIComponent(JSON.stringify(session))}`,
    "Content-Type": "application/json",
  };
};
