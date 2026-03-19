import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async_handler";
import redisUtil from "../utils/redis_util";
import { ApiError } from "../utils/api_error";

const WINDOW_SECONDS = 5;
const MAX_REQUESTS = 15;

export const rateLimiter = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const key = `rate_limit:${req.path}`;
    const count = await redisUtil.incr(key);
    if (count === 1) {
      await redisUtil.expire(key, WINDOW_SECONDS);
    }
    if (count > MAX_REQUESTS) {
      throw new ApiError(429, "Too many requests. Please try again later.");
    }
    next();
  }
);