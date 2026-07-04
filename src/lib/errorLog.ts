import { prisma } from "./prisma";

/**
 * Lightweight, homemade error monitoring — logs unhandled exceptions from
 * API routes into our own database instead of a third-party service.
 *
 * This is a reasonable starting point for a small app, but it's not a
 * replacement for real monitoring at scale: no alerting, no email/Slack
 * pings when something breaks, and it adds a small write to your main
 * database on every error. If this app grows past a few hundred daily
 * users, consider swapping this for Sentry (sentry.io) — it's a similar
 * "sign up, get a DSN, paste into env" setup as Resend/UploadThing were.
 */
export async function logError(route: string, error: unknown) {
  console.error(`[${route}]`, error);
  try {
    await prisma.errorLog.create({
      data: {
        route,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack ?? null : null,
      },
    });
  } catch (err) {
    console.error("Failed to write error log:", err);
  }
}

/** Wraps an API route handler so unexpected errors are logged and return a clean 500. */
export function withErrorLogging<T extends (...args: any[]) => Promise<Response>>(
  route: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      await logError(route, err);
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }) as T;
}
