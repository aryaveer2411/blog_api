import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async_handler";
import { ApiError } from "../utils/api_error";
import { Post } from "../models/post_model";
import { Comment } from "../models/comment_model";

export const verifyPost = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { postId } = req.params;
    if (!postId) {
      throw new ApiError(400, "PostID is required");
    }
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }
    req.postId = postId as string;
    next();
  },
);

export const verifyComment = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(400, "CommentID is required");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }
    req.commentId = commentId as string;
    next();
  },
);
