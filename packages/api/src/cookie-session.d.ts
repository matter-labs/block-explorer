import "cookie-session";
import { SiweMessage } from "siwe";

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      siwe?: SiweMessage;
      verified?: boolean;
    }
  }
}

export {};
