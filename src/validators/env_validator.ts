import { z } from "zod";

const EnvSchema = z.object({
  MONGO_ROOT_USERNAME: z.string().min(1),
  MONGO_ROOT_PASSWORD: z.string().min(1),
  MONGO_DATABASE: z.string().min(1),
  MONGO_URI: z.string().min(1),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRY: z.string().min(1),
  REFERESH_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_EXPIRY: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  REDIS_HOST: z.string().default("localhost"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL: z.string().check(z.email()),
  EMAIL_APP_PASSWORD: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export const validateEnv = (): Env => {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(z.flattenError(result.error).fieldErrors);
    process.exit(1);
  }
  return result.data;
};
