import { env } from "./config/env";
import app from "./app";
import { connectDB } from "./database";
import { connectRedisClient } from "./redis";
import logger from "./utils/logger";

const startServer = async () => {
  try {
    await connectDB();
    await connectRedisClient();

    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error("Mongo DB connection failed:", error);
    process.exit(1);
  }
};

startServer();

