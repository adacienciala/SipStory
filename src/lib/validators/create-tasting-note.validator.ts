import { z } from "zod";
import { uuidSchema } from "./uuid.validator";

export const createTastingNoteSchema = z.object({
  // Required fields
  blend_id: uuidSchema,
  overall_rating: z.number().int().min(1).max(5),

  // Optional rating fields (1-5 or null)
  umami: z.number().int().min(1).max(5).nullable().optional(),
  bitter: z.number().int().min(1).max(5).nullable().optional(),
  sweet: z.number().int().min(1).max(5).nullable().optional(),
  foam: z.number().int().min(1).max(5).nullable().optional(),

  // Optional text fields
  notes_koicha: z.string().max(5000).nullable().optional(),
  notes_milk: z.string().max(5000).nullable().optional(),

  // Optional metadata
  price_pln: z.number().int().nonnegative().nullable().optional(),
  purchase_source: z.string().max(500).nullable().optional(),
});

export type CreateTastingNoteSchema = z.infer<typeof createTastingNoteSchema>;
