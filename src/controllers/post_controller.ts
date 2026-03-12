import { Request } from "express";
import { ApiResponse } from "../utils/api_response";
import { asyncHandler } from "../utils/async_handler";
import { PostService } from "../services/post_service";
import { ApiError } from "../utils/api_error";
import {
  CreatePostRequestBody,
  EditPostRequestBody,
  PostIdParam,
} from "../types/request_types/post_request";
import { GetPost, SortField, SortOrder } from "../types/post_types/post_type";

const createPost = asyncHandler(
  async (req: Request<{}, {}, CreatePostRequestBody>, res) => {
    const { title, content } = req.body ?? {};
    const file = req.file;
    const userID = req.userID;
    if (!userID) {
      throw new ApiError(401, "Unauth request");
    }
    await PostService.createOrEditPost(title, userID, content, file);
    return res.status(200).json({
      response: new ApiResponse(200, { }, "Post Created"),
    });
  },
);

const editPost = asyncHandler(
  async (req: Request<PostIdParam, {}, EditPostRequestBody>, res) => {
    const { title, content } = req.body ?? {};
    const file = req.file;
    const userID = req.userID;
    const postId = req.params.postId;
    if (!userID) {
      throw new ApiError(401, "Unauth request");
    }
    if (!postId) {
      throw new ApiError(400, "Post ID is missing");
    }
    await PostService.createOrEditPost(
      title ?? "",
      userID,
      content,
      file,
      postId,
    );
    return res.status(200).json({
      response: new ApiResponse(200, { }, "Post Edited successfully"),
    });
  },
);

const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params ?? {};
  if (!postId) {
    throw new ApiError(401, "Post ID Missing");
  }

  const post = await PostService.getPostById(postId);

  return res.status(200).json({
    response: new ApiResponse(200, { post }, ""),
  });
});


const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params ?? {};
  if (!postId) {
    throw new ApiError(401, "Post ID Missing");
  }

   await PostService.deletePost(postId);

  return res.status(200).json({
    response: new ApiResponse(200, {  }, "Post Deleted"),
  });
});

const getUserPost = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { pageNo, itemPerPage, sortBy, sortOrder, name, isMedia } = req.query;

  const page = Number(pageNo ?? 1);
  const limit = Number(itemPerPage ?? 25);
  const sortField = (
    sortBy === "updatedAt" ? "updatedAt" : "createdAt"
  ) as SortField;
  const sortDir =
    sortOrder === "desc" || sortOrder === "-1" ? SortOrder.DESC : SortOrder.ASC;
  const media = isMedia !== undefined ? isMedia === "true" : undefined;

  const posts: GetPost = await PostService.getPosts(
    page,
    limit,
    sortField,
    sortDir,
    media,
    userId,
    typeof name === "string" ? name : undefined,
  );

  return res.status(200).json({
    response: new ApiResponse(200, posts, ""),
  });
});

const getPost = asyncHandler(async (req, res) => {
  const { pageNo, itemPerPage, sortBy, sortOrder, name, isMedia } = req.query;

  const page = Number(pageNo ?? 1);
  const limit = Number(itemPerPage ?? 25);
  const sortField = (sortBy === "updatedAt" ? "updatedAt" : "createdAt") as SortField;
  const sortDir = sortOrder === "desc" || sortOrder === "-1" ? SortOrder.DESC : SortOrder.ASC;
  const media = isMedia !== undefined ? isMedia === "true" : undefined;

  const posts: GetPost = await PostService.getPosts(
    page,
    limit,
    sortField,
    sortDir,
    media,
    undefined,
    typeof name === "string" ? name : undefined,
  );

  return res.status(200).json({
    response: new ApiResponse(200, posts, ""),
  });
});

export { createPost, editPost, deletePost, getPost, getPostById, getUserPost };
