import { Types } from "mongoose";

export enum CommentableType {
  POST = "Post",
  COMMENT = "Comment",
}

export interface IComment {
  _id: Types.ObjectId;
  content: string;
  parentComment: Types.ObjectId | null;
  owner: Types.ObjectId;
  commentableId: Types.ObjectId; // Post OR Comment
  commentableType: CommentableType; // "Post" | "Comment"
  createdAt: Date;
  updatedAt: Date;
}