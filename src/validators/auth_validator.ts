import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().check(z.email()),
  password: z.string().min(1),
});

export const RegisterSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dob: z.coerce.date(),
  email: z.string().check(z.email()),
  password: z.string().min(6),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(6),
});

export const OtpValidator = z.object({
  emailOtp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().check(z.email()),
});

export const ResetPasswordSchema = z.object({
  email: z.string().check(z.email()),
  otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
  new_password: z.string().min(6),
});
