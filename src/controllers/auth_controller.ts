// auth.controller.ts
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";

const login = asyncHandler(async (req, res) => {
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Success fully logged in"),
  });
});

const logout = asyncHandler(async (req, res) => {
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully logged out"),
  });
});

const registerUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully created user"),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  return res.status(200).json({
    response: new ApiResponse<any>(200, {}, "Succesfully created user"),
  });
});

export { login, logout, registerUser, forgotPassword };
