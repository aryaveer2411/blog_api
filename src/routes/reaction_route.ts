import { Router } from "express";
import { addReaction, removeReaction, getReactions, getUserReactions } from "../controllers/reaction_controller";
import { verfyJwt } from "../middlewares/auth_middleware";
import { verifyPost } from "../middlewares/reaction_middleware";

export const reactionRouter = Router({ mergeParams: true });
export const commentReactionRouter = Router({ mergeParams: true });
reactionRouter.use(verfyJwt, verifyPost);
commentReactionRouter.use(verfyJwt);

// POST   /posts/:postId/reactions   ← add reaction (like/love etc)
// DELETE /posts/:postId/reactions   ← remove reaction
// GET    /posts/:postId/reactions   ← get all reactions on a post

reactionRouter.route("/").post(addReaction);
reactionRouter.route("/").delete(removeReaction);
reactionRouter.route("/").get(getReactions);

// GET /posts/:postId/reactions/user/:userId  ← all reactions by a specific user on a post
reactionRouter.route("/user/:userId").get(getUserReactions);
