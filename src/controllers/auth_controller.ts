// auth.controller.ts
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { AuthService } from "../services/auth_service";
import { RegisterUserDto, LoginUserDto } from "../dtos/auth_dto";

const options = {
  httpOnly: true,
  secure: true,
};

const login = asyncHandler(async (req, res) => {
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

const registerUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, dob, email, password } = req.body;
  const data: RegisterUserDto = { first_name, last_name, dob, email, password };
  await AuthService.registerUser(data);
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully created user"),
  });
});

const changePassword = asyncHandler(async (req, res) => {
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

export { login, logout, registerUser, forgotPassword, changePassword };
