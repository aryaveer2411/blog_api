import { Request, Response, NextFunction } from "express";

type IAsyncHandler = (req: Request, res: Response, next: any) => Promise<any>;

export const asyncHandler = (fnc: IAsyncHandler) => {
  const wrapper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fnc(req, res, next);
    } catch (e) {
      next(e);
    }
  };
  return wrapper;
};
