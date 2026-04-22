import { NextRequest } from "next/server";
import axios from "axios";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/services/email";

const DEFAULT_TO = "shishirshrivastava30@gmail.com";

/**
 * Admin-only smoke test for the outbound email pipeline.
 *
 * POST /api/admin/test-email        → sends to DEFAULT_TO
 * POST /api/admin/test-email        → body { to?: string, subject?: string }
 *
 * Returns the raw Brevo error when it fails so the admin can see
 * exactly why Brevo rejected the call (bad API key, unverified
 * sender, rate limit, etc.).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const to = typeof body.to === "string" && body.to.trim() ? body.to.trim() : DEFAULT_TO;
    const subject =
      typeof body.subject === "string" && body.subject.trim()
        ? body.subject.trim()
        : "LotusMart — test email";

    const env = {
      BREVO_API_KEY_present: Boolean(process.env.BREVO_API_KEY),
      BREVO_API_KEY_length: process.env.BREVO_API_KEY?.length ?? 0,
      BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL ?? null,
      BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME ?? null,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    };

    const html = `
      <div style="font-family: sans-serif; padding: 24px;">
        <h1>LotusMart email pipeline test</h1>
        <p>This is an automated test from <code>POST /api/admin/test-email</code>.</p>
        <p>Time: <strong>${new Date().toISOString()}</strong></p>
        <p>If you receive this, Brevo is configured correctly and outbound
           transactional email works end-to-end.</p>
      </div>
    `;

    const startedAt = Date.now();
    try {
      await sendEmail({ email: to, name: to }, subject, html);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? "unknown";
        const brevoBody = JSON.stringify(err.response?.data ?? {});
        return errorResponse(
          `Email send failed (Brevo HTTP ${status}). Details: ${brevoBody}. Sender=${process.env.BREVO_SENDER_EMAIL ?? ""} To=${to}. Env: ${JSON.stringify(env)}`,
          500,
        );
      }
      throw err;
    }

    return successResponse(
      {
        to,
        subject,
        env,
        elapsed_ms: Date.now() - startedAt,
      },
      "Test email queued with Brevo successfully",
    );
  } catch (err) {
    const apiError = ApiError.from(err);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

export async function GET(request: NextRequest) {
  // Convenience: same as POST so it can be triggered from a browser.
  return POST(request);
}
