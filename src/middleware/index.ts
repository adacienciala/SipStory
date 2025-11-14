import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth pages and API endpoints that don't require authentication
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/reset-password-confirm",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/reset-password-confirm",
  "/api/auth/logout",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client with proper cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store supabase client in locals for use in API routes and pages
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else {
    locals.user = null;
  }

  // Handle redirects based on authentication state
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  // Redirect authenticated users away from auth pages to dashboard
  if (user && (url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/reset-password")) {
    return redirect("/dashboard", 302);
  }

  // Redirect unauthenticated users away from protected routes to login
  if (!user && !isPublicPath) {
    // Store the original URL to redirect back after login
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    return redirect(`/login?redirectTo=${redirectTo}`, 302);
  }

  return next();
});
