import { prisma } from "./prisma";

/**
 * Since every request in this app is already authenticated, we rate-limit
 * per user via a database count query rather than per-IP — simpler and more
 * accurate than IP-based limiting, and needs no external service (Redis etc).
 * Fine for this app's scale; if traffic grows a lot, an edge-based limiter
 * (e.g. Vercel's or Upstash Redis) would be more efficient.
 */
export async function isRateLimited(options: {
  userId: string;
  windowMinutes: number;
  maxCount: number;
  check: () => Promise<number>;
}): Promise<boolean> {
  const count = await options.check();
  return count >= options.maxCount;
}

export async function countRecentTickets(userId: string, windowMinutes: number) {
  return prisma.ticket.count({
    where: {
      submitterId: userId,
      createdAt: { gte: new Date(Date.now() - windowMinutes * 60 * 1000) },
    },
  });
}

export async function countRecentComments(userId: string, windowMinutes: number) {
  return prisma.comment.count({
    where: {
      authorId: userId,
      createdAt: { gte: new Date(Date.now() - windowMinutes * 60 * 1000) },
    },
  });
}
