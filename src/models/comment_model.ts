import mongoose, { Model, Schema } from "mongoose";
import { CommentableType, IComment } from "../types/model_types/IComment";

interface CommentModel extends Model<IComment> {}

const commentSchema = new Schema<IComment, CommentModel>(
  {
    commentableId: {
      required: true,
      type: Schema.Types.ObjectId,
      refPath: "commentableType",
    },

    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    commentableType: {
      required: true,
      type: String,
      enum: Object.values(CommentableType),
    },
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true },
);

commentSchema.index({ commentableId: 1, commentableType: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });

export const Comment = mongoose.model<IComment, CommentModel>(
  "Comment",
  commentSchema,
);
