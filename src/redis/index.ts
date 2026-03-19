import { createClient } from "redis";

export const redis = createClient().on("error", (err) => {
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
