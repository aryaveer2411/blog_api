import mongoose from "mongoose";
import { Post } from "../models/post_model";
import { IPost } from "../types/model_types/IPost";
import { ApiError } from "../utils/api_error";
import { uploadToCloudinary } from "../utils/cloudinary_util";
import { GetPost, SortField, SortOrder } from "../types/post_types/post_type";

export class PostService {
  static createOrEditPost = async (
    title: string,
    userID: string,
    content?: string,
    file?: Express.Multer.File,
    postId?: string,
  ) => {
    if (!postId) {
      if (!title) {
        throw new ApiError(400, "Title is required");
      }
      if (!content || !file) {
        throw new ApiError(400, "Content or file either one is required");
      }
    } else {
      if (!(title || content || file)) {
        throw new ApiError(400, "Nothing to update");
      }
    }
    var url = "";
    var publicId = "";

    if (file && file.buffer.length > 0) {
      const result = (await uploadToCloudinary(file.buffer)) as any;
      url = result.secure_url;
      publicId = result.public_id;
    }
    if (!postId) {
      const post = new Post({
        owner: new mongoose.Types.ObjectId(userID),
        title: title,
        content: content,
        media_url: { public_id: publicId, url: url },
      });
      await post.save();
    } else {
      const updateData: Partial<{
        title: string;
        content: string;
        media_url: { public_id: string; url: string };
      }> = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (file) updateData.media_url = { public_id: publicId, url: url };
      await Post.findByIdAndUpdate(postId, updateData, { new: true });
    }
  };

  static getPostById = async (postId: string): Promise<IPost> => {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Invalid Post Id");
    }
    return post;
  };

  static deletePost = async (postId: string) => {
    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      throw new ApiError(404, "Invalid Post Id");
    }
  };

  static getPosts = async (
    pageNo?: number,
    itemPerPage?: number,
    sortBy?: SortField,
    sortOrder?: SortOrder,
    isMedia?: boolean,
    userID?: string,
    name?: string,
  ): Promise<GetPost> => {
    const _pageNo = pageNo ?? 1;
    const _itemPerPage = itemPerPage ?? 25;
    const _sortOrder = (sortOrder as number) ?? (SortOrder.ASC as number);
    const _sortBy = (sortBy as string) ?? (SortField.createdAt as string);
    const userFilter = userID !== undefined ? { owner: userID } : {};
    const titleFilter = name ? { title: { $regex: name, $options: "i" } } : {};
    const mediaFilter =
      isMedia !== undefined ? { media_url: { $exists: isMedia } } : {};
    const filter = { ...userFilter, ...titleFilter, ...mediaFilter };

    const [total, posts] = await Promise.all([
      Post.countDocuments({ ...filter, ...userFilter }),
      Post.find({ ...filter, ...userFilter })
        .sort({ [_sortBy]: _sortOrder as 1 | -1 })
        .skip((_pageNo - 1) * _itemPerPage)
        .limit(_itemPerPage),
    ]);

    return { total, pageNo: _pageNo, itemPerPage: _itemPerPage, posts };
  };
}
