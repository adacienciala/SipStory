import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Attach Supabase client to context for use in API routes
  context.locals.supabase = supabaseClient;

  // TODO: Add session extraction when implementing full authentication
  // For now, we'll use a mock user ID in the API routes

  return next();
});
