import mongoose, { Model, Schema } from "mongoose";
import { IPost } from "../types/model_types/IPost";

interface PostModel extends Model<IPost> {}

const postSchema = new Schema<IPost, PostModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      required: true,
      type: String,
    },
    isMedia: {
      type: Boolean,
      default: false,
    },
    owner: {
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost, PostModel>("Post", postSchema);
