import { createClient } from "redis";
import { env } from "../config/env";
import logger from "../utils/logger";

export const redis = createClient({
  socket: { host: env.REDIS_HOST, port: 6379 },
}).on("error", (err: Error) => {
  logger.error("Redis Error:", err);
});

export const connectRedisClient = async () => {
  try {
    await redis.connect();
    logger.info("Redis client connected");
  } catch (e) {
    logger.error("Redis client error", e);
  }
};
