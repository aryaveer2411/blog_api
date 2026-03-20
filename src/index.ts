import { env } from "./config/env";
import app from "./app";
import { connectDB } from "./database";
import { connectRedisClient } from "./redis";

const startServer = async () => {
  try {
    await connectDB();
    await connectRedisClient();

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Mongo DB connection failed:", error);
    process.exit(1);
  }
};

startServer();

