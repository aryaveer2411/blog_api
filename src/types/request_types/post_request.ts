export interface CreatePostRequestBody {
  title: string;
  content?: string;
}

export interface EditPostRequestBody {
  title?: string;
  content?: string;
}

export interface PostIdParam {
  postId: string;
}
