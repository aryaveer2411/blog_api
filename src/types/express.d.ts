declare global {
  namespace Express {
    interface Request {
      userEmail?: string;
      userID?: string;
      postId?: string;
    }
  }
}

export {};
