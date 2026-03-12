import { IPost } from "../model_types/IPost";

export enum SortOrder {
  ASC = 1,
  DESC = -1,
}

export enum SortField {
  createdAt = "createdAt",
  updatedAt = "updatedAt",
}

export interface GetPost {
  total: number;
  pageNo: number;
  itemPerPage: number;
  posts: IPost[];
}
