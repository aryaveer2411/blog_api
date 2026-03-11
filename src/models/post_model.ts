import mongoose, { Model, Schema } from "mongoose";
import { IPost } from "../types/model_types/IPost";
import { MediaSchema } from "./media_model";

interface PostModel extends Model<IPost> {}

const postSchema = new Schema<IPost, PostModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
    },
    media_url: MediaSchema,
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost, PostModel>("Post", postSchema);
