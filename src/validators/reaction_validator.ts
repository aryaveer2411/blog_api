import { z } from "zod";
import { ReactionValue } from "../types/model_types/IReaction";

export const ReactionBodySchema = z.object({
  reaction: z.nativeEnum(ReactionValue),
});

export const ReactionPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(25),
});
