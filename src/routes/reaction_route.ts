import { Router } from "express";
import {
  addReaction,
  removeReaction,
  getReactions,
  getUserReactions,
  addCommentReaction,
  removeCommentReaction,
  getCommentReactions,
} from "../controllers/reaction_controller";
import { verfyJwt } from "../middlewares/auth_middleware";
import { verifyPost, verifyComment } from "../middlewares/reaction_middleware";

export const reactionRouter = Router({ mergeParams: true });
export const commentReactionRouter = Router({ mergeParams: true });

reactionRouter.use(verfyJwt, verifyPost);
commentReactionRouter.use(verfyJwt, verifyPost, verifyComment);

// POST   /posts/:postId/reactions          ← add reaction
// DELETE /posts/:postId/reactions          ← remove reaction
// GET    /posts/:postId/reactions          ← get all reactions on a post
// GET    /posts/:postId/reactions/user/:userId

reactionRouter.route("/").post(addReaction).delete(removeReaction).get(getReactions);
reactionRouter.route("/user/:userId").get(getUserReactions);

// POST   /posts/:postId/comments/:commentId/reactions   ← add reaction to comment
// DELETE /posts/:postId/comments/:commentId/reactions   ← remove reaction from comment
// GET    /posts/:postId/comments/:commentId/reactions   ← get reactions on comment

commentReactionRouter.route("/").post(addCommentReaction).delete(removeCommentReaction).get(getCommentReactions);
