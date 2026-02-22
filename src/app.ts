import express,{Request,Response} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth_route";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);

app.use(express.static("public"));
app.use(cookieParser());

app.use('api/v1/auth', authRouter);


export default app;
