import { env } from "./config/env";
import express, { Request, Response, NextFunction } from "express";
import { ApiError } from "./utils/api_error";
import logger from "./utils/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth_route";
import { postRouter } from "./routes/post_route";
import { commentReactionRouter, reactionRouter } from "./routes/reaction_route";
import { commentRouter } from "./routes/comment_route";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger";
import { rateLimiter } from "./middlewares/rate_limiter";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(rateLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/post/:postId/reactions", reactionRouter);

app.use("/api/v1/post/:postId/comments", commentRouter);

app.use(
  "/api/v1/post/:postId/comments/:commentId/reactions",
  commentReactionRouter,
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    logger.warn(`${err.statusCode} - ${err.message}`);
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message, errors: err.errors });
  }
  logger.error(err);
  return res
    .status(500)
    .json({ success: false, message: err.message || "Internal server error" });
});

export default app;
