import { Router } from "express";
import {
  createPost,
  deletePost,
  editPost,
  getPost,
  getUserPost,
  getPostById,
} from "../controllers/post_controller";
import { verfyJwt } from "../middlewares/auth_middleware";
import { upload } from "../middlewares/upload_middleware";

export const postRouter = Router();
postRouter.use(verfyJwt);

// POST   /posts              ← create post
// GET    /posts              ← get all posts (feed)
// GET    /posts/:postId      ← get single post
// PUT    /posts/:postId      ← update post
// DELETE /posts/:postId      ← delete post and clear media
// GET    /posts/user/:userId ← get all posts by a user

postRouter.route("/").get(getPost);
postRouter.route("/").post(upload.single("file"), createPost);
postRouter.route("/user/:userId").get(getUserPost);
postRouter.route("/:postId").put(upload.single("file"), editPost);
postRouter.route("/:postId").delete(deletePost);
postRouter.route("/:postId").get(getPostById);
