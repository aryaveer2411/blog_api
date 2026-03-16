// auth.controller.ts
import { Request } from "express";
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ApiError } from "../utils/api_error";
import { AuthService } from "../services/auth_service";
import { RegisterUserDto, LoginUserDto } from "../dtos/auth_dto";
import { LoginRequestBody, RegisterRequestBody, ChangePasswordRequestBody } from "../types/request_types/auth_request";

const options = {
  httpOnly: true,
  secure: true,
};

const login = asyncHandler(async (req: Request<{}, {}, LoginRequestBody>, res) => {
  const { email, password } = req.body;
  const loginData: LoginUserDto = { email, password };
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
});

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

const registerUser = asyncHandler(async (req: Request<{}, {}, RegisterRequestBody>, res) => {
  const { first_name, last_name, dob, email, password } = req.body;
  const data: RegisterUserDto = { first_name, last_name, dob, email, password };
  await AuthService.registerUser(data);
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully created user"),
  });
});

const changePassword = asyncHandler(async (req: Request<{}, {}, ChangePasswordRequestBody>, res) => {
  const { old_password, new_password } = req.body;
  const userEmail = req.userEmail ?? "";
  await AuthService.changePassword(old_password, new_password, userEmail);
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully password changed"),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully created user"),
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
    response: new ApiResponse<any>(200, {}, "Profile picture updated successfully"),
  });
});

export { login, logout, registerUser, forgotPassword, changePassword, updateProfilePicture };
