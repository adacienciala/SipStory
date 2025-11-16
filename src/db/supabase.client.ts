import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { SUPABASE_KEY, SUPABASE_URL } from "astro:env/server";

import type { Database } from "./database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parses the Cookie header string into an array of cookie objects
 * @param cookieHeader - The Cookie header string from the request
 * @returns Array of cookie objects with name and value
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server client with proper cookie handling for SSR
 * Uses @supabase/ssr with getAll/setAll pattern for cookie management
 * @param context - Object containing headers and cookies from Astro context
 * @returns Configured Supabase client instance
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
