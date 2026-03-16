import { ApiError } from "../utils/api_error";
import { asyncHandler } from "../utils/async_handler";
import { ApiResponse } from "../utils/api_response";
import { CommentService } from "../services/comment_service";
import { CommentBodySchema, CommentPaginationQuerySchema } from "../validators/comment_validator";

// POST /posts/:postId/comments
const addComment = asyncHandler(async (req, res) => {
  const { content } = CommentBodySchema.parse(req.body);
  const result = await CommentService.addCommentToPost(
    req.postId!,
    content,
    req.userID!,
  );
  return res
    .status(201)
    .json({ response: new ApiResponse(201, result, "Comment added") });
});

// POST /posts/:postId/comments/:commentId/replies
const addReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = CommentBodySchema.parse(req.body);
  const result = await CommentService.addReplyToComment(
    commentId,
    content,
    req.userID!,
  );
  return res
    .status(201)
    .json({ response: new ApiResponse(201, result, "Reply added") });
});

// GET /posts/:postId/comments
const getComments = asyncHandler(async (req, res) => {
  const { page, limit } = CommentPaginationQuerySchema.parse(req.query);
  const result = await CommentService.getCommentsOnPost(
    req.postId!,
    page,
    limit,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, result, "Comments fetched") });
});

// GET /posts/:postId/comments/:commentId/replies
const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { page, limit } = CommentPaginationQuerySchema.parse(req.query);
  const result = await CommentService.getRepliesOnComment(
    commentId,
    page,
    limit,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, result, "Replies fetched") });
});

// PATCH /posts/:postId/comments/:commentId
const editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = CommentBodySchema.parse(req.body);
  const result = await CommentService.editComment(
    commentId,
    content,
    req.userID!,
  );
  return res
    .status(200)
    .json({ response: new ApiResponse(200, result, "Comment updated") });
});

// DELETE /posts/:postId/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  await CommentService.deleteComment(commentId, req.userID!);
  return res
    .status(200)
    .json({ response: new ApiResponse(200, null, "Comment deleted") });
});

export { addComment, addReply, getComments, getReplies, editComment, deleteComment };
