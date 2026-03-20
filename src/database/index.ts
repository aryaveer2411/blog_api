import mongoose from "mongoose";
import { env } from "../config/env";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = env.MONGO_URI;
    console.log(mongoURI);
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
