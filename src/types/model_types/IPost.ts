import { Types } from "mongoose";

export interface IPost {
  _id: Types.ObjectId;
  title:string,
  content: string;
  owner: Types.ObjectId;
  isMedia: boolean;
  createdAt: Date;
  updatedAt: Date;
}
