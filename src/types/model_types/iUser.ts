import { Types } from "mongoose";

export interface IProfile {
  url: string;
  public_id: string;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IUser {
  _id: Types.ObjectId;
  first_name: string;
  last_name: string;
  dob: Date;
  profile_url: IProfile;
  password: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  refreshToken: string;
}
