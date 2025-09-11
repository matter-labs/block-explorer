import { AUTH_ERRORS, PRIVIDIUM_AUTH_CONSTANTS } from "./constants";

export interface PrividiumAuthConfig {
  clientId: string;
  redirectUri: string;
  userPanelUrl: string;
}

export interface AuthResult {
  token: string;
  state: string;
}

export class PrividiumAuth {
  private clientId: string;
  private redirectUri: string;
  private userPanelUrl: string;
  private state: string | null = null;

  constructor(config: PrividiumAuthConfig) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.userPanelUrl = config.userPanelUrl;
  }

  /**
   * Initiates the login flow by redirecting to User Panel
   */
  login(): void {
    this.state = this.generateRandomState();
    sessionStorage.setItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY, this.state);

    const url = new URL(PRIVIDIUM_AUTH_CONSTANTS.AUTH_ENDPOINTS.AUTHORIZE, this.userPanelUrl);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("state", this.state);
    url.searchParams.set("response_type", "token");
    url.searchParams.set("scope", "wallet:required");

    window.location.href = url.toString();
  }

  /**
   * Handles the callback after authentication
   * Call this on your callback page
   */
  handleCallback(): AuthResult | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const token = params.get("token");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      throw new Error(`${AUTH_ERRORS.AUTHENTICATION_FAILED}: ${error}`);
    }

    // Validate state to prevent CSRF
    const savedState = sessionStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY);

    if (state !== savedState) {
      throw new Error(AUTH_ERRORS.INVALID_STATE);
    }

    if (!token || !state) {
      return null;
    }

    // Store token
    this.setToken(token);
    sessionStorage.removeItem(PRIVIDIUM_AUTH_CONSTANTS.STATE_KEY);

    // Clear hash from URL
    window.location.hash = "";

    return { token, state };
  }

  /**
   * Gets the stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(PRIVIDIUM_AUTH_CONSTANTS.TOKEN_KEY);
  }

  /**
   * Sets the JWT token
   */
  setToken(token: string): void {
    localStorage.setItem(PRIVIDIUM_AUTH_CONSTANTS.TOKEN_KEY, token);
  }

  /**
   * Clears the stored JWT token
   */
  clearToken(): void {
    localStorage.removeItem(PRIVIDIUM_AUTH_CONSTANTS.TOKEN_KEY);
  }

  /**
   * Logs out the user by clearing the token
   */
  logout(): void {
    this.clearToken();
    // Optionally redirect to User Panel logout to clear Okta session
    if (this.userPanelUrl) {
      window.location.href = `${this.userPanelUrl}${
        PRIVIDIUM_AUTH_CONSTANTS.AUTH_ENDPOINTS.LOGOUT
      }?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    }
  }

  /**
   * Generates a cryptographically secure random state
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
}
