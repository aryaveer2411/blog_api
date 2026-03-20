import { Redis } from "@upstash/redis";
import { env } from "../config/env";
import logger from "../utils/logger";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_URL,
  token: env.UPSTASH_REDIS_TOKEN,
});

// No persistent connection needed — Upstash is HTTP-based.
// Kept for interface compatibility with index.ts startup sequence.
export const connectRedisClient = async () => {
  logger.info("Upstash Redis ready (HTTP)");
};
