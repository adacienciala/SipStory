import type { APIRoute } from "astro";

import { passwordRecoverySchema } from "@/lib/validators/auth.validator";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 * Initiates the password reset flow by sending a reset email
 * Always returns success to prevent user enumeration
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validation = passwordRecoverySchema.safeParse(body);

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

    const { email } = validation.data;

    // Build the redirect URL for password reset confirmation
    const origin = url.origin;
    const redirectTo = `${origin}/reset-password-confirm`;

    // Request password reset from Supabase
    await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Note: We return success even if the email doesn't exist
    // This prevents user enumeration attacks
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, a password reset link has been sent.",
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
        error: "An unexpected error occurred during password reset request",
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
