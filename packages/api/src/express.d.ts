declare global {
  namespace Express {
    interface Request {
      // Set by AuthMiddleware in Prividium mode for Etherscan API (/api) requests.
      identity?: {
        hasFullReadAccess: boolean;
        hasFullWriteAccess: boolean;
      };
    }
  }
}

export {};
