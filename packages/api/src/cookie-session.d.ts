import "cookie-session";

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      token?: string;
      address?: string;
    }
  }
}

export {};
