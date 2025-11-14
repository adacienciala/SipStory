import type { APIRoute } from "astro";

import { registerSchema } from "@/lib/validators/auth.validator";

export const prerender = false;

/**
 * POST /api/auth/register
 * Creates a new user account with email and password
 * Supabase will send a confirmation email to the user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validation = registerSchema.safeParse(body);

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

    // Sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "A user with this email already exists",
          }),
          {
            status: 409,
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

    // Success - user created (confirmation email sent by Supabase)
    return new Response(
      JSON.stringify({
        user: data.user,
        message: "Account created! Please check your email to confirm your account.",
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred during registration",
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
