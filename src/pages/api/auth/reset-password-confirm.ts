import type { APIRoute } from "astro";

import { passwordResetConfirmSchema } from "@/lib/validators/auth.validator";

export const prerender = false;

/**
 * POST /api/auth/reset-password-confirm
 * Updates the user's password after they click the reset link
 * First exchanges the code for a session, then updates the password
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema - now expects both password and token
    const validation = passwordResetConfirmSchema.safeParse(body);

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

    const { password, token } = validation.data;

    // Exchange the code for a session (PKCE flow)
    const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(token);

    if (exchangeError) {
      return new Response(
        JSON.stringify({
          error: exchangeError.message || "Invalid or expired reset token",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Now update the password using the authenticated session
    const { data, error } = await locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message || "Failed to update password",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success - password updated
    return new Response(
      JSON.stringify({
        user: data.user,
        message: "Password updated successfully. You can now login with your new password.",
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
        error: "An unexpected error occurred while updating password",
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
