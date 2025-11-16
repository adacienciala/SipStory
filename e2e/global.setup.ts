/* eslint-disable no-console */
import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import type { Database } from "../src/db/database.types";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Global setup to prepare test data in Supabase database
 * Creates a test user with seed data: brands, regions, blends, and a sample tasting note
 */
setup("setup test database with seed data", async () => {
  console.log("🌱 Starting database setup with seed data...");

  // Validate required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME_WITH_DATA;
  const testUserPassword = process.env.E2E_PASSWORD_WITH_DATA;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing required environment variables: SUPABASE_URL or SUPABASE_KEY");
    throw new Error("Missing Supabase configuration");
  }

  if (!testUserEmail || !testUserPassword) {
    console.error("❌ Missing required environment variables: E2E_USERNAME_WITH_DATA or E2E_PASSWORD_WITH_DATA");
    throw new Error("Missing test user credentials");
  }

  try {
    // Create Supabase client with service role capabilities
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Step 1: Create or sign in the test user
    console.log(`👤 Setting up test user: ${testUserEmail}...`);

    let userId: string;

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (signInError || !signInData.user) {
      console.log("📝 User doesn't exist, creating new test user...");

      // Create new user if sign-in fails
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testUserEmail,
        password: testUserPassword,
        options: {
          emailRedirectTo: process.env.BASE_URL || "http://localhost:3000",
        },
      });

      if (signUpError || !signUpData.user) {
        console.error("❌ Error creating test user:", signUpError?.message);
        throw signUpError || new Error("Failed to create test user");
      }

      userId = signUpData.user.id;
      console.log(`✅ Test user created with ID: ${userId}`);
    } else {
      userId = signInData.user.id;
      console.log(`✅ Test user signed in with ID: ${userId}`);
    }

    // Step 2: Create seed regions
    console.log("🌏 Creating seed regions...");
    const seedRegions = [{ name: "Uji" }, { name: "Kagoshima" }, { name: "Shizuoka" }, { name: "Nishio" }];

    const { data: regions, error: regionsError } = await supabase
      .from("regions")
      .upsert(seedRegions, { onConflict: "name", ignoreDuplicates: true })
      .select();

    if (regionsError) {
      console.error("❌ Error creating regions:", regionsError.message);
      throw regionsError;
    }

    console.log(`✅ Created ${regions?.length || 0} region(s)`);

    // Fetch all regions to get their IDs (in case some already existed)
    const { data: allRegions, error: fetchRegionsError } = await supabase
      .from("regions")
      .select("*")
      .in(
        "name",
        seedRegions.map((r) => r.name)
      );

    if (fetchRegionsError || !allRegions) {
      console.error("❌ Error fetching regions:", fetchRegionsError?.message);
      throw fetchRegionsError || new Error("Failed to fetch regions");
    }

    // Step 3: Create seed brands
    console.log("🏷️  Creating seed brands...");
    const seedBrands = [{ name: "Ippodo" }, { name: "Marukyu Koyamaen" }, { name: "Hibiki-an" }, { name: "Aiya" }];

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .upsert(seedBrands, { onConflict: "name", ignoreDuplicates: true })
      .select();

    if (brandsError) {
      console.error("❌ Error creating brands:", brandsError.message);
      throw brandsError;
    }

    console.log(`✅ Created ${brands?.length || 0} brand(s)`);

    // Fetch all brands to get their IDs (in case some already existed)
    const { data: allBrands, error: fetchBrandsError } = await supabase
      .from("brands")
      .select("*")
      .in(
        "name",
        seedBrands.map((b) => b.name)
      );

    if (fetchBrandsError || !allBrands) {
      console.error("❌ Error fetching brands:", fetchBrandsError?.message);
      throw fetchBrandsError || new Error("Failed to fetch brands");
    }

    // Step 4: Create seed blends
    console.log("🍵 Creating seed blends...");
    const ujiRegion = allRegions.find((r) => r.name === "Uji");
    const kagoshimaRegion = allRegions.find((r) => r.name === "Kagoshima");
    const shizuokaRegion = allRegions.find((r) => r.name === "Shizuoka");

    const ippodoBrand = allBrands.find((b) => b.name === "Ippodo");
    const marukyu = allBrands.find((b) => b.name === "Marukyu Koyamaen");

    if (!ujiRegion || !kagoshimaRegion || !shizuokaRegion || !ippodoBrand || !marukyu) {
      throw new Error("Failed to find required regions or brands for blend creation");
    }

    const seedBlends = [
      {
        name: "Ummon-no-mukashi",
        brand_id: ippodoBrand.id,
        region_id: ujiRegion.id,
      },
      {
        name: "Kusurinoki",
        brand_id: marukyu.id,
        region_id: ujiRegion.id,
      },
      {
        name: "Premium Ceremonial",
        brand_id: ippodoBrand.id,
        region_id: kagoshimaRegion.id,
      },
      {
        name: "Organic Matcha",
        brand_id: marukyu.id,
        region_id: shizuokaRegion.id,
      },
    ];

    // Check which blends already exist (checking by brand_id + name since that's the unique constraint)
    const { data: existingBlends, error: checkBlendsError } = await supabase
      .from("blends")
      .select("name, brand_id")
      .in(
        "name",
        seedBlends.map((b) => b.name)
      );

    if (checkBlendsError) {
      console.error("❌ Error checking existing blends:", checkBlendsError.message);
      throw checkBlendsError;
    }

    // Create a set of existing blend keys (brand_id + name)
    const existingBlendKeys = new Set(existingBlends?.map((b) => `${b.brand_id}-${b.name}`) || []);
    const newBlends = seedBlends.filter((b) => !existingBlendKeys.has(`${b.brand_id}-${b.name}`));

    // Insert only new blends
    if (newBlends.length > 0) {
      const { error: insertBlendsError } = await supabase.from("blends").insert(newBlends);

      if (insertBlendsError) {
        console.error("❌ Error creating blends:", insertBlendsError.message);
        throw insertBlendsError;
      }

      console.log(`✅ Created ${newBlends.length} new blend(s)`);
    } else {
      console.log("ℹ️  All blends already exist");
    }

    // Fetch all blends to get their IDs
    const { data: allBlends, error: fetchBlendsError } = await supabase
      .from("blends")
      .select("*")
      .in(
        "name",
        seedBlends.map((b) => b.name)
      );

    if (fetchBlendsError || !allBlends) {
      console.error("❌ Error fetching blends:", fetchBlendsError?.message);
      throw fetchBlendsError || new Error("Failed to fetch blends");
    }

    // Step 5: Create a sample tasting note for the user
    console.log("📝 Creating sample tasting note...");
    const sampleBlend = allBlends.find((b) => b.name === "Ummon-no-mukashi");

    if (!sampleBlend) {
      throw new Error("Failed to find sample blend for tasting note creation");
    }

    const sampleTastingNote = {
      user_id: userId,
      blend_id: sampleBlend.id,
      overall_rating: 5,
      umami: 5,
      bitter: 2,
      sweet: 4,
      foam: 5,
      notes_koicha: "Rich, creamy texture with deep umami. Excellent balance of flavors.",
      notes_milk: "Smooth and pleasant. Pairs beautifully with oat milk.",
      price_pln: 150,
      purchase_source: "https://ippodo-tea.co.jp",
    };

    // Check if tasting note already exists for this user and blend
    const { data: existingNote, error: checkError } = await supabase
      .from("tasting_notes")
      .select("id")
      .eq("user_id", userId)
      .eq("blend_id", sampleBlend.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("❌ Error checking existing tasting note:", checkError.message);
      throw checkError;
    }

    if (existingNote) {
      console.log("ℹ️  Sample tasting note already exists, skipping creation");
    } else {
      const { error: tastingNoteError } = await supabase.from("tasting_notes").insert(sampleTastingNote);

      if (tastingNoteError) {
        console.error("❌ Error creating sample tasting note:", tastingNoteError.message);
        throw tastingNoteError;
      }

      console.log("✅ Created sample tasting note");
    }

    console.log("🎉 Database setup completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • User ID: ${userId}`);
    console.log(`   • Email: ${testUserEmail}`);
    console.log(`   • Regions: ${allRegions.length}`);
    console.log(`   • Brands: ${allBrands.length}`);
    console.log(`   • Blends: ${allBlends.length}`);
    console.log(`   • Tasting Notes: ${existingNote ? "1 (existing)" : "1 (new)"}`);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    throw error;
  }
});
