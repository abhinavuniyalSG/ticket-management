declare global {
  namespace Express {
    interface Request {
      normalized?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
