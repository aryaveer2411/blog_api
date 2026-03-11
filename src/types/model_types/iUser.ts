import { Types } from "mongoose";
import { IMedia } from "./IMedia";



export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IUser {
  _id?: Types.ObjectId;
  first_name: string;
  last_name: string;
  dob: Date;
  profile_url?: IMedia;
  password: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  refreshToken?: string;
}
