import { Types } from "mongoose";
import { IMedia } from "./IMedia";

export interface IPost {
  _id: Types.ObjectId;
  title: string;
  content?: string;
  owner: Types.ObjectId;
  media_url?: IMedia;
  createdAt: Date;
  updatedAt: Date;
}
