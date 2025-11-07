import { z } from "zod";
import { uuidSchema } from "./uuid.validator";

/**
 * Validation schema for creating a new blend
 * Enforces XOR logic: brand and region must have either ID or name, not both
 */

// Brand nested validation: either id OR name, not both, not neither
const brandSchema = z
  .object({
    id: uuidSchema.nullable().optional(),
    name: z.string().min(1).max(100).trim().nullable().optional(),
  })
  .refine(
    (data) => {
      const hasId = data.id !== null && data.id !== undefined;
      const hasName = data.name !== null && data.name !== undefined && data.name !== "";
      // XOR: exactly one must be true
      return (hasId && !hasName) || (!hasId && hasName);
    },
    {
      message: "must provide either id OR name, not both and not neither",
    }
  );

// Region nested validation: either id OR name, not both, not neither
const regionSchema = z
  .object({
    id: uuidSchema.nullable().optional(),
    name: z.string().min(1).max(100).trim().nullable().optional(),
  })
  .refine(
    (data) => {
      const hasId = data.id !== null && data.id !== undefined;
      const hasName = data.name !== null && data.name !== undefined && data.name !== "";
      // XOR: exactly one must be true
      return (hasId && !hasName) || (!hasId && hasName);
    },
    {
      message: "must provide either id OR name, not both and not neither",
    }
  );

export const createBlendSchema = z.object({
  name: z.string().min(1, "must be at least 1 character").max(200).trim(),
  brand: brandSchema,
  region: regionSchema,
});

export type CreateBlendSchema = z.infer<typeof createBlendSchema>;
