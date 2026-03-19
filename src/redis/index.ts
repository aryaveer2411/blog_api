import { createClient } from "redis";

export const redis = createClient({
  socket: { host: process.env.REDIS_HOST ?? "localhost", port: 6379 },
}).on("error", (err: Error) => {
  console.log("Redis Error:", err);
});

export const connectRedisClient = async () => {
  try {
    await redis.connect();
    console.log("Redis client connected");
  } catch (e) {
    console.log("Redis client error", e);
  }
};
