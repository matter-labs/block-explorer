import "cookie-session";

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      token?: string;
      address?: string;
      wallets?: string[];
      roles?: string[];
      hasFullReadAccess?: boolean;
      expiresAt?: string;
    }
  }
}

export {};
