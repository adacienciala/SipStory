/* eslint-disable no-console */
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import type { Database } from "../src/db/database.types";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Global teardown to clean up test data from Supabase database
 * Deletes all tasting notes created during E2E tests
 */
teardown("cleanup test database", async () => {
  console.log("🧹 Starting database cleanup...");

  // Validate required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;
  const testUserEmail = process.env.E2E_USERNAME_WITH_DATA;
  const testUserPassword = process.env.E2E_PASSWORD_WITH_DATA;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing required environment variables: SUPABASE_URL or SUPABASE_KEY");
    throw new Error("Missing Supabase configuration");
  }

  try {
    // Create Supabase client with service role capabilities
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Delete tasting notes for the test user
    if (testUserId && testUserEmail && testUserPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      if (signInError) {
        console.error("❌ Error signing in:", signInError.message);
        throw signInError;
      }

      console.log(`🗑️  Deleting tasting notes for test user ID: ${testUserId}...`);

      const { error: tastingNotesError, count } = await supabase
        .from("tasting_notes")
        .delete({ count: "exact" })
        .eq("user_id", testUserId);

      if (tastingNotesError) {
        console.error("❌ Error deleting tasting notes:", tastingNotesError.message);
        throw tastingNotesError;
      }

      console.log(`✅ Deleted ${count ?? 0} tasting note(s) for test user`);
    } else {
      throw new Error("E2E_USERNAME_ID not set");
    }
    console.log("🎉 Database cleanup completed successfully");
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    throw error;
  }
});
