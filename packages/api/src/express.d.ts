declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        token: string;
      };
    }
  }
}

export {};
