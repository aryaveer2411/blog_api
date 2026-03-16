import mongoose from "mongoose";
import { Post } from "../models/post_model";
import { Reaction } from "../models/reaction_model";
import {
  IReaction,
  ReactableType,
  ReactionValue,
} from "../types/model_types/IReaction";
import { ApiError } from "../utils/api_error";
import { User } from "../models/user_model";

export class ReactionService {
  static addReactionToPost = async (
    postID: string,
    reaction: ReactionValue,
    userID: string,
  ): Promise<IReaction> => {
    const updatedReaction = await Reaction.findOneAndUpdate(
      { user: userID, reactableId: postID },
      {
        $set: { value: reaction },
        $setOnInsert: {
          user: userID,
          reactableId: postID,
          reactableType: ReactableType.POST,
        },
      },
      { upsert: true, new: true },
    );
    return updatedReaction;
  };

  static removeReactionFromPost = async (postID: string, userID: string) => {
    await Reaction.findOneAndDelete({
      user: userID,
      reactableId: postID,
    });
  };

  static addReactionToComment = async (
    commentId: string,
    reaction: ReactionValue,
    userID: string,
  ): Promise<IReaction> => {
    const updatedReaction = await Reaction.findOneAndUpdate(
      { user: userID, reactableId: commentId },
      {
        $set: { value: reaction },
        $setOnInsert: {
          user: userID,
          reactableId: commentId,
          reactableType: ReactableType.COMMENT,
        },
      },
      { upsert: true, new: true },
    );
    return updatedReaction;
  };

  static removeReactionFromComment = async (
    commentId: string,
    userID: string,
  ): Promise<void> => {
    await Reaction.findOneAndDelete({ user: userID, reactableId: commentId });
  };

  static getReactionsOnComment = async (
    commentId: string,
    page: number,
    limit: number,
  ): Promise<{ reactions: IReaction[]; total: number }> => {
    const [result] = await Reaction.aggregate([
      {
        $match: {
          reactableId: new mongoose.Types.ObjectId(commentId),
          reactableType: ReactableType.COMMENT,
        },
      },
      {
        $facet: {
          reactions: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);
    return {
      reactions: result.reactions,
      total: result.total[0]?.count ?? 0,
    };
  };

  static getReactionOnPost = async (
    postID: string,
    page: number,
    limit: number,
    userId?: string,
  ): Promise<{ reactions: IReaction[]; total: number }> => {
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(401, "Invalid User ID");
      }
    }
    const query = {
      reactableId: postID,
      reactableType: ReactableType.POST,
      ...(userId && { user: new mongoose.Types.ObjectId(userId) }),
    };

    const [result] = await Reaction.aggregate([
      {
        $match: query,
      },
      {
        $facet: {
          reactions: [
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
          ],
          total: [
            {
              $count: "count",
            },
          ],
        },
      },
    ]);
    return {
      reactions: result.reactions,
      total: result.total[0]?.count ?? 0,
    };
  };
}
