declare global {
  namespace Express {
    interface Request {
      userEmail?: string;
      userID?: string;
    }
  }
}

export {};
