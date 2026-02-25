import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async_handler";
import { ApiError } from "../utils/api_error";
import jwt from "jsonwebtoken";
import { User } from "../models/user_model";

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
        process.env.ACCESS_TOKEN_SECRET!,
      ) as AccessTokenPayload;

      const user = await User.findOne({ email: decoded.email });

      if (!user) throw new ApiError(401, "User not found");

      req.user = user;
      return next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
          throw new ApiError(401, "Session expired");
        }

        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET!,
        )as AccessTokenPayload;;

        const user = await User.findOne({email:decodedRefresh.email});

        if (!user || user.refreshToken !== refreshToken) {
          throw new ApiError(401, "Invalid refresh token");
        }

        const newAccessToken = user.generateAccessToken();

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
        });

        req.user = user;
        return next();
      }

      throw new ApiError(401, "Invalid token");
    }
  },
);
