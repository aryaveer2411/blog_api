import mongoose from "mongoose";
import { env } from "../config/env";
import logger from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = env.MONGO_URI;
    const conn = await mongoose.connect(mongoURI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
