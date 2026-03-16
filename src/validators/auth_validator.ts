import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dob: z.coerce.date(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(6),
});
