import mongoose, { HydratedDocument, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserMethods, IProfile } from "../types/model_types/iUser";
import jwt, { SignOptions } from "jsonwebtoken";

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

export const UserSchema = new Schema<IUser, UserModel, UserMethods>(
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
      type:String,
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
    profile_url: ProfileSchema,
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.methods.comparePassword = async function (password: string) {
   if (!this.password) {
     throw new Error(
       "Password not loaded. Did you forget .select('+password')?",
     );
   }
  return bcrypt.compare(password, this.password);
};

export type UserDocument = HydratedDocument<IUser, UserMethods>;

UserSchema.methods.generateAccessToken =  function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.first_name,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY! as SignOptions["expiresIn"],
    },
  );
}

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.first_name,
    },
    process.env.REFERESH_TOKEN_SECRET!,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY! as SignOptions["expiresIn"],
    },
  );
};

UserSchema.pre("save", async function (this: HydratedDocument<IUser>) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
