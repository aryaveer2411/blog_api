// auth.controller.ts
import { Request } from "express";
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import { AuthService } from "../services/auth_service";
import { RegisterUserDto, LoginUserDto } from "../dtos/auth_dto";
import {
  LoginRequestBody,
  RegisterRequestBody,
  ChangePasswordRequestBody,
} from "../types/request_types/auth_request";
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  OtpValidator,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../validators/auth_validator";

const options = {
  httpOnly: true,
  secure: true,
};

const login = asyncHandler(
  async (req: Request<{}, {}, LoginRequestBody>, res) => {
    const loginSchema = LoginSchema.parse(req.body);
    const loginData: LoginUserDto = {
      email: loginSchema.email,
      password: loginSchema.password,
    };
    const { accessToken, refToken } = await AuthService.loginUser(loginData);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refToken, options)
      .json({
        response: new ApiResponse<any>(
          200,
          {
            accessToken: accessToken,
            refreshToken: refToken,
          },
          "Success fully logged in",
        ),
      });
  },
);

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await AuthService.logoutUser(refreshToken);
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully logged out"),
  });
});

const registerUser = asyncHandler(
  async (req: Request<{}, {}, RegisterRequestBody>, res) => {
    const registerSchema = RegisterSchema.parse(req.body);
    const data: RegisterUserDto = {
      first_name: registerSchema.first_name,
      last_name: registerSchema.last_name,
      dob: registerSchema.dob,
      email: registerSchema.email,
      password: registerSchema.password,
    };
    await AuthService.registerUser(data);
    return res.status(200).json({
      response: new ApiResponse<any>(200, {}, "Succesfully created user"),
    });
  },
);

const changePassword = asyncHandler(
  async (req: Request<{}, {}, ChangePasswordRequestBody>, res) => {
    const changePasswordSchema = ChangePasswordSchema.parse(req.body);
    const { old_password, new_password } = changePasswordSchema;
    const userEmail = req.userEmail ?? "";
    await AuthService.changePassword(old_password, new_password, userEmail);
    return res.status(200).json({
      response: new ApiResponse<any>(200, {}, "Succesfully password changed"),
    });
  },
);

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = ForgotPasswordSchema.parse(req.body);
  const { emailVerified } = await AuthService.forgotPassword(email);
  const message = emailVerified
    ? "Password reset OTP sent to your email"
    : "Your email is not verified. Cannot reset password";
  return res.status(200).json({
    response: new ApiResponse<any>(200, { emailVerified }, message),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, new_password } = ResetPasswordSchema.parse(req.body);
  await AuthService.resetPassword(email, otp, new_password);
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Password reset successfully"),
  });
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  const userEmail = req.userEmail ?? "";
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Profile picture is required");
  }
  await AuthService.updateProfilePicture(userEmail, file);
  return res.status(200).json({
    response: new ApiResponse<any>(
      200,
      {},
      "Profile picture updated successfully",
    ),
  });
});

const sendEmailOtp = asyncHandler(async (req, res) => {
  const email = req.userEmail!;
  await AuthService.sendEmailOtp(email);
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Email Otp Sent"),
  });
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
  const email = req.userEmail!;
  const {emailOtp} = OtpValidator.parse(req.body);
  await AuthService.verifyEmailOtp(email, emailOtp);
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Email Otp Verified"),
  });
});

export {
  login,
  logout,
  registerUser,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfilePicture,
  sendEmailOtp,
  verifyEmailOtp,
};
