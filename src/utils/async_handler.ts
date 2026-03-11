import { Request, Response, NextFunction } from "express";

type IAsyncHandler<P = any, ResB = any, ReqB = any> = (req: Request<P, ResB, ReqB>, res: Response, next: any) => Promise<any>;

export const asyncHandler = <P = any, ResB = any, ReqB = any>(fnc: IAsyncHandler<P, ResB, ReqB>) => {
  const wrapper = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fnc(req as Request<P, ResB, ReqB>, res, next);
    } catch (e) {
      next(e);
    }
  };
  return wrapper;
};
