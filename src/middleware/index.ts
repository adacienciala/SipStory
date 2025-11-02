import { createClient } from "@supabase/supabase-js";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Get the authorization header from the request
  const authHeader = context.request.headers.get("Authorization");

  if (authHeader) {
    // Extract the token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");

    // Create a Supabase client with the user's auth token
    // This ensures RLS policies work correctly
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the token and get user info
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (user && !error) {
      // Authenticated request
      context.locals.supabase = supabase;
      context.locals.user = user;
    } else {
      // Invalid token - create unauthenticated client
      const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
      context.locals.supabase = unauthClient;
      context.locals.user = null;
    }
  } else {
    // No auth header - create unauthenticated client
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    context.locals.supabase = unauthClient;
    context.locals.user = null;
  }

  return next();
});
