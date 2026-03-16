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
import { CreatePostSchema, EditPostSchema, GetPostsQuerySchema } from "../validators/post_validator";

const createPost = asyncHandler(
  async (req: Request<{}, {}, CreatePostRequestBody>, res) => {
    const { title, content } = CreatePostSchema.parse(req.body);
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
    const { title, content } = EditPostSchema.parse(req.body);
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
  const query = GetPostsQuerySchema.parse(req.query);

  const sortField = query.sortBy as SortField;
  const sortDir =
    query.sortOrder === "desc" || query.sortOrder === "-1"
      ? SortOrder.DESC
      : SortOrder.ASC;
  const media = query.isMedia !== undefined ? query.isMedia === "true" : undefined;

  const posts: GetPost = await PostService.getPosts(
    query.pageNo,
    query.itemPerPage,
    sortField,
    sortDir,
    media,
    userId,
    query.name,
  );

  return res.status(200).json({
    response: new ApiResponse(200, posts, ""),
  });
});

const getPost = asyncHandler(async (req, res) => {
  const query = GetPostsQuerySchema.parse(req.query);

  const sortField = query.sortBy as SortField;
  const sortDir =
    query.sortOrder === "desc" || query.sortOrder === "-1"
      ? SortOrder.DESC
      : SortOrder.ASC;
  const media = query.isMedia !== undefined ? query.isMedia === "true" : undefined;

  const posts: GetPost = await PostService.getPosts(
    query.pageNo,
    query.itemPerPage,
    sortField,
    sortDir,
    media,
    undefined,
    query.name,
  );

  return res.status(200).json({
    response: new ApiResponse(200, posts, ""),
  });
});

export { createPost, editPost, deletePost, getPost, getPostById, getUserPost };
