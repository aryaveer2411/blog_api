import mongoose, { HydratedDocument, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserMethods, IProfile } from "../types/model_types/iUser";

interface UserModel extends Model<IUser, {}, UserMethods> {}

const ProfileSchema = new Schema<IProfile>(
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

const UserSchema = new Schema<IUser, UserModel, UserMethods>(
  {
    first_name: {
      required: true,
      trim: true,
      type: String,
    },
    last_name: {
      required: true,
      trim: true,
      type: String,
    },
    dob: {
      required: true,
      type: Date,
    },
    email: {
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    password: {
      required: true,
      type: String,
      select: false,
    },
    profile_url: {
      required: true,
      type: ProfileSchema,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.methods.comparePassword = async function (password: string) {
 return bcrypt.compare(password, this.password);
};

UserSchema.pre("save", async function (this: HydratedDocument<IUser>) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
