import { z } from "zod";

export const updateTastingNoteSchema = z
  .object({
    // Optional rating fields
    overall_rating: z.number().int().min(1).max(5).optional(),
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
  })
  .strict() // Reject any fields not explicitly defined
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateTastingNoteSchema = z.infer<typeof updateTastingNoteSchema>;
