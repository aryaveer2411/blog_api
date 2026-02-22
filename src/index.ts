import app from "./app";
import { connectDB } from "./database";
import * as dotenv from "dotenv";

dotenv.config();   

const startServer = async () => {
  try {
    await connectDB();

    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Mongo DB connection failed:", error);
    process.exit(1); // Very important
  }
};

startServer();

