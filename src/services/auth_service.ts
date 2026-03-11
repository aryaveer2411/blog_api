import { HydratedDocument } from "mongoose";
import jwt from "jsonwebtoken";
import { LoginUserDto, RegisterUserDto } from "../dtos/auth_dto";
import { User } from "../models/user_model";
import type { UserDocument, User as UserType } from "../models/user_model";
import { IUser } from "../types/model_types/iUser";
import { ApiError } from "../utils/api_error";
import { AccessTokenPayload } from "../middlewares/auth_middleware";

export class AuthService {
  static registerUser = async (data: RegisterUserDto): Promise<void> => {
    const isUserExist = await User.findOne({ email: data.email });
    if (isUserExist) {
      throw new ApiError(400, "user already exist with this email");
    }
    const user = new User({
      dob: data.dob,
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
    });

    const isUserCreated = await user.save();
    console.log(isUserCreated);
  };

  static generateJWTToken = (
    user: UserDocument,
  ): { refToken: string; accessToken: string } => {
    const refToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    return { refToken, accessToken };
  };

  static loginUser = async (
    data: LoginUserDto,
  ): Promise<{ refToken: string; accessToken: string }> => {
    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) {
      throw new ApiError(400, "user doesnt exist with this email");
    }
    const isPasswordCorrect = await user.comparePassword(data.password);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "user doesnt exist with this email");
    }
    const { refToken, accessToken } = this.generateJWTToken(user);
    user.refreshToken = refToken;
    await user.save();
    return { accessToken, refToken };
  };

  static logoutUser = async (refreshToken: string) => {
    if (!refreshToken) {
      throw new ApiError(401, "Session expired");
    }
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as AccessTokenPayload;

    const user = await User.findOne({ email: decodedRefresh.email });
    if (user) {
      user!.refreshToken = undefined;
      await user.save();
    }
  };

  static changePassword = async (oldPassword:string,newPassword:string,userEmail:string)=>{
    const user = await User.findOne({"email": userEmail}).select('+password');
    if (!user) {
      throw new ApiError(500, "No user Exist");
    }
    const isPasswordCorrect = user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(500, "Incorrect Password");
    }
    user.password = newPassword;
    await user.save();
  }
}
