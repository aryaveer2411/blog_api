import mongoose from "mongoose";
import { Post } from "../models/post_model";
import { ApiError } from "../utils/api_error";
import { uploadToCloudinary } from "../utils/cloudinary_util";

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
        console.log("dam,nmnmnmnm");
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
      const updateData: Partial<{ title: string; content: string; media_url: { public_id: string; url: string } }> = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (file) updateData.media_url = { public_id: publicId, url: url };
      await Post.findByIdAndUpdate(postId, updateData, { new: true });
    }
  };
}