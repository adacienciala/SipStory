import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 * Uses @supabase/ssr which handles cookie cleanup automatically
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out from Supabase
    // @supabase/ssr automatically clears auth cookies via setAll callback
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred during logout",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
