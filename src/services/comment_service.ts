import mongoose from "mongoose";
import { Comment } from "../models/comment_model";
import { IComment, CommentableType } from "../types/model_types/IComment";
import { ApiError } from "../utils/api_error";
import redisUtil from "../utils/redis_util";

export class CommentService {
  // Add a top-level comment on a post
  static addCommentToPost = async (
    postId: string,
    content: string,
    userId: string,
  ): Promise<IComment> => {
    const comment = await Comment.create({
      content,
      owner: userId,
      commentableId: new mongoose.Types.ObjectId(postId),
      commentableType: CommentableType.POST,
      parentComment: null,
    });
    await redisUtil.delByPattern(`comments:post:${postId}:*`);
    return comment;
  };

  // Add a reply to an existing comment (nested comment)
  static addReplyToComment = async (
    parentCommentId: string,
    content: string,
    userId: string,
  ): Promise<IComment> => {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      throw new ApiError(404, "Parent comment not found");
    }
    const reply = await Comment.create({
      content,
      owner: userId,
      commentableId: new mongoose.Types.ObjectId(parentCommentId),
      commentableType: CommentableType.COMMENT,
      parentComment: new mongoose.Types.ObjectId(parentCommentId),
    });
    await redisUtil.delByPattern(`replies:${parentCommentId}:*`);
    return reply;
  };

  // Get top-level comments on a post (paginated)
  static getCommentsOnPost = async (
    postId: string,
    page: number,
    limit: number,
  ): Promise<{ comments: IComment[]; total: number }> => {
    const cacheKey = `comments:post:${postId}:p${page}:l${limit}`;
    const cached = await redisUtil.get<{ comments: IComment[]; total: number }>(cacheKey);
    if (cached) return cached;

    const [result] = await Comment.aggregate([
      {
        $match: {
          commentableId: new mongoose.Types.ObjectId(postId),
          commentableType: CommentableType.POST,
          parentComment: null,
        },
      },
      {
        $facet: {
          comments: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);
    const data = {
      comments: result.comments,
      total: result.total[0]?.count ?? 0,
    };
    await redisUtil.set(cacheKey, data, 60);
    return data;
  };

  // Get replies to a comment (paginated)
  static getRepliesOnComment = async (
    parentCommentId: string,
    page: number,
    limit: number,
  ): Promise<{ comments: IComment[]; total: number }> => {
    const cacheKey = `replies:${parentCommentId}:p${page}:l${limit}`;
    const cached = await redisUtil.get<{ comments: IComment[]; total: number }>(cacheKey);
    if (cached) return cached;

    const [result] = await Comment.aggregate([
      {
        $match: {
          parentComment: new mongoose.Types.ObjectId(parentCommentId),
        },
      },
      {
        $facet: {
          comments: [
            { $sort: { createdAt: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);
    const data = {
      comments: result.comments,
      total: result.total[0]?.count ?? 0,
    };
    await redisUtil.set(cacheKey, data, 60);
    return data;
  };

  // Edit a comment (only owner)
  static editComment = async (
    commentId: string,
    content: string,
    userId: string,
  ): Promise<IComment> => {
    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, owner: userId },
      { $set: { content } },
      { new: true },
    );
    if (!comment) {
      throw new ApiError(404, "Comment not found or you are not the owner");
    }
    if (comment.commentableType === CommentableType.POST) {
      await redisUtil.delByPattern(`comments:post:${comment.commentableId}:*`);
    } else {
      await redisUtil.delByPattern(`replies:${comment.commentableId}:*`);
    }
    return comment;
  };

  // Delete a comment and all nested replies via $graphLookup
  static deleteComment = async (
    commentId: string,
    userId: string,
  ): Promise<void> => {
    const comment = await Comment.findOne({ _id: commentId, owner: userId });
    if (!comment) {
      throw new ApiError(404, "Comment not found or you are not the owner");
    }
    if (comment.commentableType === CommentableType.POST) {
      await redisUtil.delByPattern(`comments:post:${comment.commentableId}:*`);
    } else {
      await redisUtil.delByPattern(`replies:${comment.commentableId}:*`);
    }
    const descendants = await Comment.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(commentId) } },
      {
        $graphLookup: {
          from: "comments",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentComment",
          as: "descendants",
        },
      },
      { $project: { descendantIds: "$descendants._id" } },
    ]);
    const descendantIds: mongoose.Types.ObjectId[] =
      descendants[0]?.descendantIds ?? [];
    await Comment.deleteMany({
      _id: { $in: [new mongoose.Types.ObjectId(commentId), ...descendantIds] },
    });
  };
}
