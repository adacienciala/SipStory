import type { SupabaseClient } from "../../db/supabase.client";
import type { BlendResponseDTO, CreateBlendDTO } from "../../types";

/**
 * Error types for blend creation
 */
type CreateBlendError =
  | { type: "brand_not_found" }
  | { type: "region_not_found" }
  | { type: "duplicate_blend" }
  | { type: "database_error"; message: string };

type CreateBlendResult = { success: true; data: BlendResponseDTO } | { success: false; error: CreateBlendError };

/**
 * Creates a new blend with flexible brand/region resolution
 * Can reference existing entities by ID or create new ones by name
 *
 * @param supabase - Supabase client instance
 * @param data - Validated blend data from request
 * @returns Result object with either success data or error
 *
 * @example
 * // Create blend with existing brand/region by ID
 * const result = await createBlend(supabase, {
 *   name: "Ceremonial Grade",
 *   brand: { id: "brand-uuid" },
 *   region: { id: "region-uuid" }
 * });
 *
 * @example
 * // Create blend with new brand/region by name
 * const result = await createBlend(supabase, {
 *   name: "Premium Matcha",
 *   brand: { name: "Ippodo Tea" },
 *   region: { name: "Uji, Kyoto" }
 * });
 */
export async function createBlend(supabase: SupabaseClient, data: CreateBlendDTO): Promise<CreateBlendResult> {
  try {
    // Step 1: Resolve Brand ID
    let brandId: string;

    if (data.brand.id) {
      // Verify brand exists by ID
      const { data: existingBrand, error } = await supabase
        .from("brands")
        .select("id")
        .eq("id", data.brand.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: { type: "database_error", message: error.message } };
      }

      if (!existingBrand) {
        return { success: false, error: { type: "brand_not_found" } };
      }

      brandId = existingBrand.id;
    } else if (data.brand.name) {
      // Look up or create brand by name (case-insensitive via CITEXT)
      const { data: existingBrand, error: lookupError } = await supabase
        .from("brands")
        .select("id, name")
        .eq("name", data.brand.name) // CITEXT handles case-insensitivity
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        return { success: false, error: { type: "database_error", message: lookupError.message } };
      }

      if (existingBrand) {
        // Brand exists, use existing ID
        brandId = existingBrand.id;
      } else {
        // Brand doesn't exist, create new one
        const { data: newBrand, error: insertError } = await supabase
          .from("brands")
          .insert({ name: data.brand.name })
          .select("id")
          .single();

        if (insertError || !newBrand) {
          return {
            success: false,
            error: { type: "database_error", message: insertError?.message || "Failed to create brand" },
          };
        }

        brandId = newBrand.id;
      }
    } else {
      // Should never happen due to Zod validation
      return { success: false, error: { type: "database_error", message: "Invalid brand data" } };
    }

    // Step 2: Resolve Region ID
    let regionId: string;

    if (data.region.id) {
      // Verify region exists by ID
      const { data: existingRegion, error } = await supabase
        .from("regions")
        .select("id")
        .eq("id", data.region.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: { type: "database_error", message: error.message } };
      }

      if (!existingRegion) {
        return { success: false, error: { type: "region_not_found" } };
      }

      regionId = existingRegion.id;
    } else if (data.region.name) {
      // Look up or create region by name (case-insensitive via CITEXT)
      const { data: existingRegion, error: lookupError } = await supabase
        .from("regions")
        .select("id, name")
        .eq("name", data.region.name) // CITEXT handles case-insensitivity
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        return { success: false, error: { type: "database_error", message: lookupError.message } };
      }

      if (existingRegion) {
        // Region exists, use existing ID
        regionId = existingRegion.id;
      } else {
        // Region doesn't exist, create new one
        const { data: newRegion, error: insertError } = await supabase
          .from("regions")
          .insert({ name: data.region.name })
          .select("id")
          .single();

        if (insertError || !newRegion) {
          return {
            success: false,
            error: { type: "database_error", message: insertError?.message || "Failed to create region" },
          };
        }

        regionId = newRegion.id;
      }
    } else {
      // Should never happen due to Zod validation
      return { success: false, error: { type: "database_error", message: "Invalid region data" } };
    }

    // Step 3: Check for duplicate blend (same name + brand_id + region_id)
    const { data: duplicateBlend, error: duplicateError } = await supabase
      .from("blends")
      .select("id")
      .eq("name", data.name) // CITEXT handles case-insensitivity
      .eq("brand_id", brandId)
      .eq("region_id", regionId)
      .limit(1)
      .maybeSingle();

    if (duplicateError) {
      return { success: false, error: { type: "database_error", message: duplicateError.message } };
    }

    if (duplicateBlend) {
      return { success: false, error: { type: "duplicate_blend" } };
    }

    // Step 4: Create blend
    const { data: newBlend, error: createError } = await supabase
      .from("blends")
      .insert({
        name: data.name,
        brand_id: brandId,
        region_id: regionId,
      })
      .select("id")
      .single();

    if (createError || !newBlend) {
      return {
        success: false,
        error: { type: "database_error", message: createError?.message || "Failed to create blend" },
      };
    }

    // Step 5: Fetch complete blend with nested brand and region
    const { data: completeBlend, error: fetchError } = await supabase
      .from("blends")
      .select(
        `
        id,
        name,
        created_at,
        brand:brands!inner (
          id,
          name
        ),
        region:regions!inner (
          id,
          name
        )
      `
      )
      .eq("id", newBlend.id)
      .single();

    if (fetchError || !completeBlend) {
      return {
        success: false,
        error: { type: "database_error", message: fetchError?.message || "Failed to fetch created blend" },
      };
    }

    return { success: true, data: completeBlend };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in createBlend:", error);
    return {
      success: false,
      error: {
        type: "database_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
