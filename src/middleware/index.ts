import { createClient } from "@supabase/supabase-js";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = new URL(context.request.url).pathname;

  // Get the authorization header from the request (for API calls)
  const authHeader = context.request.headers.get("Authorization");

  // Try to get auth from cookies (for browser sessions)
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  let supabase;
  let user = null;

  if (authHeader) {
    // API request with Authorization header
    const token = authHeader.replace("Bearer ", "");
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  } else if (accessToken && refreshToken) {
    // Browser session with cookies
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Set the session from cookies
    const { data } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    user = data.user;

    // Update cookies if tokens were refreshed
    if (data.session) {
      context.cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
      context.cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }
  } else {
    // No authentication - create unauthenticated client
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  // Set context locals
  context.locals.supabase = supabase;
  context.locals.user = user;

  // Handle redirects based on authentication state
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (user && isPublicRoute) {
    // Authenticated users accessing login/register should be redirected to dashboard
    return context.redirect("/", 302);
  }

  // Protected routes handled by individual pages
  return next();
});
