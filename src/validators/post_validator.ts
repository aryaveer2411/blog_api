import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

export const EditPostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

export const GetPostsQuerySchema = z.object({
  pageNo: z.coerce.number().int().positive().default(1),
  itemPerPage: z.coerce.number().int().positive().default(25),
  sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc", "1", "-1"]).default("asc"),
  name: z.string().optional(),
  isMedia: z.enum(["true", "false"]).optional(),
});
