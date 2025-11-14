import type { APIRoute } from "astro";

import { loginSchema } from "@/lib/validators/auth.validator";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 * Sets session cookies automatically via @supabase/ssr
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.errors[0].message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validation.data;

    // Sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("Invalid login credentials")) {
        return new Response(
          JSON.stringify({
            error: "Invalid email or password",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

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

    // Success - cookies are automatically set by @supabase/ssr
    return new Response(
      JSON.stringify({
        user: data.user,
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
        error: "An unexpected error occurred during login",
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
