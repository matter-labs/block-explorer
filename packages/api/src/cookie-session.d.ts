import "cookie-session";

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      token?: string;
      address?: string;
      wallets?: string[];
      roles?: string[];
      expiresAt?: string;
    }
  }
}

export {};
