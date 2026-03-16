import { Router } from "express";
import {
  addComment,
  addReply,
  getComments,
  getReplies,
  editComment,
  deleteComment,
} from "../controllers/comment_controller";
import { verfyJwt } from "../middlewares/auth_middleware";
import { verifyPost } from "../middlewares/reaction_middleware";

// POST   /posts/:postId/comments                        ← add comment
// GET    /posts/:postId/comments                        ← get comments on post
// POST   /posts/:postId/comments/:commentId/replies     ← reply to comment
// GET    /posts/:postId/comments/:commentId/replies     ← get replies
// PATCH  /posts/:postId/comments/:commentId             ← edit comment
// DELETE /posts/:postId/comments/:commentId             ← delete comment

export const commentRouter = Router({ mergeParams: true });

commentRouter.use(verfyJwt, verifyPost);

commentRouter.route("/").post(addComment).get(getComments);
commentRouter.route("/:commentId").patch(editComment).delete(deleteComment);
commentRouter.route("/:commentId/replies").post(addReply).get(getReplies);
