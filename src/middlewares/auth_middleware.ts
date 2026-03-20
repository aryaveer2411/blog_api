import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async_handler";
import { ApiError } from "../utils/api_error";
import jwt from "jsonwebtoken";
import { User } from "../models/user_model";
import RedisUtil from "../utils/redis_util";
import { IUser } from "../types/model_types/iUser";
import { env } from "../config/env";

export interface AccessTokenPayload {
  _id: string;
  email: string;
  userName: string;
}

export const verfyJwt = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized");
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        env.ACCESS_TOKEN_SECRET,
      ) as AccessTokenPayload;
      const cacheUser = await RedisUtil.get<IUser>(decoded.email);
      const user = cacheUser ?? (await User.findOne({ email: decoded.email }));
      if (!user) throw new ApiError(401, "User not found");
      if (!cacheUser) await RedisUtil.set(decoded.email, user);
      req.userEmail = user.email;
      req.userID = user._id!.toString();
      return next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
          throw new ApiError(401, "Session expired");
        }

        const decodedRefresh = jwt.verify(
          refreshToken,
          env.REFERESH_TOKEN_SECRET,
        ) as AccessTokenPayload;

        const user = await User.findOne({ email: decodedRefresh.email });

        if (!user || user.refreshToken !== refreshToken) {
          throw new ApiError(401, "Invalid refresh token");
        }

        const newAccessToken = user.generateAccessToken();

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
        });

        req.userEmail = user.email;
        req.userID = user._id.toString();
        return next();
      }

      throw new ApiError(401, "Invalid token");
    }
  },
);
