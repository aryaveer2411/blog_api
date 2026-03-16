import { ApiError } from "../utils/api_error";
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ReactionService } from "../services/reaction_service";
import { ReactionBodySchema, ReactionPaginationQuerySchema } from "../validators/reaction_validator";

const addReaction = asyncHandler(async (req, res) => {
  const { reaction } = ReactionBodySchema.parse(req.body);
  const userID = req.userID;

  const result = await ReactionService.addReactionToPost(
    req.postId!,
    reaction,
    userID!,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, result, "Reaction added") });
});

const removeReaction = asyncHandler(async (req, res) => {
  const userID = req.userID;

  const result = await ReactionService.removeReactionFromPost(
    req.postId!,
    userID!,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, result, "Reaction Removed") });
});

const getReactions = asyncHandler(async (req, res) => {
  const { page, limit } = ReactionPaginationQuerySchema.parse(req.query);
  const reactions = await ReactionService.getReactionOnPost(
    req.postId!,
    page,
    limit,
  );
  return res
    .status(200)
    .json({
      response: new ApiResponse(
        200,
        reactions,
        "SuccessFully fetched reactions",
      ),
    });
});

// GET /users/:userId/reactions  ← all posts a user reacted on
const getUserReactions = asyncHandler(async (req, res) => {
  const { userID } = req.params;
  if (!userID) {
    throw new ApiError(400, "User ID is required");
  }
  const { page, limit } = ReactionPaginationQuerySchema.parse(req.query);
  const reactions = await ReactionService.getReactionOnPost(
    req.postId!,
    page,
    limit,
    userID,
  );
  return res.status(200).json({
    response: new ApiResponse(200, reactions, "SuccessFully fetched reactions"),
  });
});

const addCommentReaction = asyncHandler(async (req, res) => {
  const { reaction } = ReactionBodySchema.parse(req.body);
  const result = await ReactionService.addReactionToComment(
    req.commentId!,
    reaction,
    req.userID!,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, result, "Reaction added") });
});

const removeCommentReaction = asyncHandler(async (req, res) => {
  await ReactionService.removeReactionFromComment(req.commentId!, req.userID!);
  return res
    .status(200)
    .json({ response: new ApiResponse(200, null, "Reaction removed") });
});

const getCommentReactions = asyncHandler(async (req, res) => {
  const { page, limit } = ReactionPaginationQuerySchema.parse(req.query);
  const reactions = await ReactionService.getReactionsOnComment(
    req.commentId!,
    page,
    limit,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, reactions, "Reactions fetched") });
});

export {
  addReaction,
  removeReaction,
  getReactions,
  getUserReactions,
  addCommentReaction,
  removeCommentReaction,
  getCommentReactions,
};
