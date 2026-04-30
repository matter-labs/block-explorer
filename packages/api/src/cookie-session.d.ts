import "cookie-session";

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      token?: string;
      address?: string;
      wallets?: string[];
      roles?: string[];
      isAdmin?: boolean;
      expiresAt?: string;
    }
  }
}

export {};
