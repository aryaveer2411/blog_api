import { Router } from "express";
import { forgotPassword, login, logout, registerUser } from "../controllers/auth_controller";

export const authRouter = Router();

authRouter.route('/login').post(login);
authRouter.route("/logout").post(logout);
authRouter.route("/register-user").post(registerUser);
authRouter.route("/forgot-password").post(forgotPassword); 
//authRouter.route("/refresh-token").post(forgotPassword); 


