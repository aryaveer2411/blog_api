import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  registerUser,
} from "../controllers/auth_controller";
import { verfyJwt } from "../middlewares/auth_middleware";

export const authRouter = Router();

authRouter.route("/login").post(login);
authRouter.route("/logout").post(logout);
authRouter.route("/register-user").post(registerUser);
authRouter.route("/change-password").post(verfyJwt, changePassword);
// authRouter.route("/forgot-password").post(forgotPassword);
