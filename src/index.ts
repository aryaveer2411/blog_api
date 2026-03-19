import app from "./app";
import { connectDB } from "./database";
import * as dotenv from "dotenv";
import { connectRedisClient } from "./redis";

dotenv.config();   

const startServer = async () => {
  try {
    await connectDB();
    await connectRedisClient();

    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Mongo DB connection failed:", error);
    process.exit(1);
  }
};

startServer();

