import { HydratedDocument } from "mongoose";
import jwt from "jsonwebtoken";
import { LoginUserDto, RegisterUserDto } from "../dtos/auth_dto";
import { User } from "../models/user_model";
import type { UserDocument, User as UserType } from "../models/user_model";
import { ApiError } from "../utils/api_error";
import { env } from "../config/env";
import { AccessTokenPayload } from "../middlewares/auth_middleware";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary_util";
import { sendEmail } from "../utils/node_mailer_util";
import RedisUtil from "../utils/redis_util";

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
      env.REFERESH_TOKEN_SECRET,
    ) as AccessTokenPayload;

    const user = await User.findOne({ email: decodedRefresh.email });
    if (user) {
      user!.refreshToken = undefined;
      await user.save();
    }
  };

  static updateProfilePicture = async (
    userEmail: string,
    file: Express.Multer.File,
  ) => {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.profile_url?.public_id) {
      await deleteFromCloudinary(user.profile_url.public_id);
    }
    const result = (await uploadToCloudinary(file.buffer)) as any;
    user.profile_url = { public_id: result.public_id, url: result.secure_url };
    await user.save();
  };

  static changePassword = async (
    oldPassword: string,
    newPassword: string,
    userEmail: string,
  ) => {
    const user = await User.findOne({ email: userEmail }).select("+password");
    if (!user) {
      throw new ApiError(500, "No user Exist");
    }
    const isPasswordCorrect = user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(500, "Incorrect Password");
    }
    user.password = newPassword;
    await user.save();
  };

  static sendEmailOtp = async (userEmail: string): Promise<void> => {
    const user = await User.findOne({ email: userEmail });
    if (!user) throw new ApiError(404, "User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await RedisUtil.set(`otp:${userEmail}`, otp, 600);

    const subject = "Your verification code";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="margin:0 0 8px;color:#111827;">Hi ${user.first_name},</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#111827;">${otp}</div>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail(userEmail, subject, html);
  };

  static verifyEmailOtp = async (userEmail: string, otp: string): Promise<void> => {
    const stored = await RedisUtil.get<string>(`otp:${userEmail}`);
    if (!stored || stored !== otp) throw new ApiError(400, "Invalid or expired OTP");

    await RedisUtil.del(`otp:${userEmail}`);

    const user = await User.findOne({ email: userEmail });
    if (!user) throw new ApiError(404, "User not found");

    user.email_verified = true;
    await user.save();

    const subject = "Email verified successfully";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="margin:0 0 8px;color:#111827;">Hi ${user.first_name},</h2>
        <p style="color:#6b7280;margin:0 0 0;">Your email address has been successfully verified. You're all set!</p>
      </div>
    `;

    await sendEmail(userEmail, subject, html);
  };

  static forgotPassword = async (
    userEmail: string,
  ): Promise<{ emailVerified: boolean }> => {
    const user = await User.findOne({ email: userEmail });
    if (!user) throw new ApiError(404, "User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!user.email_verified) {
      return { emailVerified: false };
    }

    await RedisUtil.set(`otp:reset:${userEmail}`, otp, 600);
    const subject = "Your password reset code";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="margin:0 0 8px;color:#111827;">Hi ${user.first_name},</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#111827;">${otp}</div>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    await sendEmail(userEmail, subject, html);
    return { emailVerified: true };
  };

  static resetPassword = async (
    userEmail: string,
    otp: string,
    newPassword: string,
  ): Promise<void> => {
    const stored = await RedisUtil.get<string>(`otp:reset:${userEmail}`);
    if (!stored || stored !== otp) throw new ApiError(400, "Invalid or expired OTP");

    await RedisUtil.del(`otp:reset:${userEmail}`);

    const user = await User.findOne({ email: userEmail }).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    user.password = newPassword;
    await user.save();
  };
}
