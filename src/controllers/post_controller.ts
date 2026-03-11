import { Request } from "express";
import { ApiResponse } from "../utils/api_response";
import { asyncHandler } from "../utils/async_handler";
import { PostService } from "../services/post_service";
import { ApiError } from "../utils/api_error";
import { CreatePostRequestBody, EditPostRequestBody, PostIdParam } from "../types/request_types/post_request";

const createPost = asyncHandler(async (req: Request<{}, {}, CreatePostRequestBody>, res) => {
  const { title, content } = req.body ?? {};
  const file = req.file;
  const userID = req.userID;
  if (!userID) {
    throw new ApiError(401, "Unauth request");
  }
  await PostService.createOrEditPost(title, userID, content, file);
  return res.status(200).json({
    response: new ApiResponse(200, { status: "success" }, ""),
  });
});

const editPost = asyncHandler(async (req: Request<PostIdParam, {}, EditPostRequestBody>, res) => {
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
  await PostService.createOrEditPost(title ?? "", userID, content, file, postId);
  return res.status(200).json({
    response: new ApiResponse(200, { status: "success" }, ""),
  });
});

const getPostById = asyncHandler(async (req, res) => {
  // wil handle search
  // will handle sort
  // add pagination
});
const getUserPost = asyncHandler(async (req, res) => {});
const deletePost = asyncHandler(async (req, res) => {});

const getPost = asyncHandler(async (req, res) => {
  // wil handle search
  // will handle sort
  // add pagination
});

export { createPost, editPost, deletePost, getPost, getPostById, getUserPost };