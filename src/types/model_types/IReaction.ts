import { Types } from "mongoose";

export enum ReactionValue {
  LIKE = 1,
  DISLIKE = -1,
}

export enum ReactableType {
  POST = "Post",
  COMMENT = "Comment",
}

export interface IReaction {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  reactableId: Types.ObjectId; // post or comment
  reactableType: ReactableType;
  value: ReactionValue;
}
