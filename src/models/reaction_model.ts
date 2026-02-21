import mongoose, { Model, Schema } from "mongoose";
import { IReaction, ReactableType, ReactionValue } from "../types/model_types/IReaction";

interface ReactionModel extends Model<IReaction>{ };

const reactionSchema = new Schema<IReaction, ReactionModel>({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reactableId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "reactableType",
    },

    reactableType: {
      type: String,
      required: true,
      enum: Object.values(ReactableType),
    },

    value: {
      type: Number,
      required: true,
      enum: Object.values(ReactionValue),
    },
});

reactionSchema.index(
  { user: 1, reactableId: 1, reactableType: 1 },
  { unique: true },
);

reactionSchema.index({ reactableId: 1, reactableType: 1 });
  
export const Reaction = mongoose.model<IReaction, ReactionModel>(
  "Reaction",
  reactionSchema,
);