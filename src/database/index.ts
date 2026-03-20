import mongoose from "mongoose";
import { env } from "../config/env";
import logger from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = env.MONGO_URI;
    const connectionInstance = await mongoose.connect(mongoURI);
    logger.info(`MongoDB Connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
