import { z } from "zod";

/**
 * UUID validation schema for path parameters
 * Validates that the provided ID is a valid UUID format
 */
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

/**
 * Inferred type from the UUID validation schema
 */
export type UuidInput = z.infer<typeof uuidSchema>;
