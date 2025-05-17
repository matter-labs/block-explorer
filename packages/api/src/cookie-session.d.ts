import "cookie-session";
import { SiweMessage } from "siwe";

declare global {
  namespace CookieSessionInterfaces {
    interface CookieSessionObject {
      nonce?: string;
      siwe?: SiweMessage;
    }
  }
}

export {};
