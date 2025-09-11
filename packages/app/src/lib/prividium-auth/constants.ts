export const PRIVIDIUM_AUTH_CONSTANTS = {
  STATE_KEY: "prividium_auth_state",
  TOKEN_KEY: "prividium_jwt",
  SILENT_AUTH_TIMEOUT: 5000,
  DEFAULT_USER_PANEL_URL: "http://localhost:3001",
  AUTH_ENDPOINTS: {
    AUTHORIZE: "/auth/authorize",
    SILENT_CHECK: "/auth/silent-check",
    LOGOUT: "/logout",
  },
} as const;

export const AUTH_ERRORS = {
  INVALID_STATE: "Invalid state parameter",
  NO_TOKEN: "No token received",
  AUTHENTICATION_FAILED: "Authentication failed",
  INVALID_CONFIG: "Invalid authentication configuration",
  METAMASK_NOT_FOUND: "MetaMask not found",
} as const;
