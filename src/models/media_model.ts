import { Schema } from "mongoose";
import { IMedia } from "../types/model_types/IMedia";

export const MediaSchema = new Schema<IMedia>(
  {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);
