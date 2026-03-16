import { ApiError } from "../utils/api_error";
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { ReactionService } from "../services/reaction_service";
import { response } from "express";

const addReaction = asyncHandler(async (req, res) => {
  const { reaction } = req.body;
  if (!reaction) {
    throw new ApiError(400, "Missing reaction value");
  }
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
  const { page, limit } = req.query;
  const pageNo = Number(page) || 1;
  const itemPerPage = Number(limit) || 25;
  const reactions = await ReactionService.getReactionOnPost(
    req.postId!,
    pageNo,
    itemPerPage,
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
  const { page, limit } = req.query;
  const { userID } = req.params;
  if (!userID) {
    throw new ApiError(400, "User ID is required");
  }
  const pageNo = Number(page) || 1;
  const itemPerPage = Number(limit) || 25;
  const reactions = await ReactionService.getReactionOnPost(
    req.postId!,
    pageNo,
    itemPerPage,
    userID,
  );
  return res.status(200).json({
    response: new ApiResponse(200, reactions, "SuccessFully fetched reactions"),
  });
});

const addCommentReaction = asyncHandler(async (req, res) => {
  const { reaction } = req.body;
  if (!reaction) {
    throw new ApiError(400, "Missing reaction value");
  }
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
  const { page, limit } = req.query;
  const pageNo = Number(page) || 1;
  const itemPerPage = Number(limit) || 25;
  const reactions = await ReactionService.getReactionsOnComment(
    req.commentId!,
    pageNo,
    itemPerPage,
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
