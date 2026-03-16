import { z } from "zod";

export const CommentBodySchema = z.object({
  content: z.string().min(1),
});

export const CommentPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(25),
});
