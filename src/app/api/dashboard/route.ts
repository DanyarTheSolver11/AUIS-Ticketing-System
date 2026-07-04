import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "SUBMITTER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [total, open, inProgress, resolved, closed, overdue, byTech] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.ticket.count({ where: { status: "CLOSED" } }),
    prisma.ticket.count({
      where: {
        dueAt: { lt: new Date() },
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    }),
    prisma.ticket.groupBy({
      by: ["assigneeId"],
      _count: { _all: true },
      where: { assigneeId: { not: null } },
    }),
  ]);

  // Average resolution time in hours, for resolved tickets
  const resolvedTickets = await prisma.ticket.findMany({
    where: { resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
  });
  const avgResolutionHours =
    resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const hours = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 36e5;
          return sum + hours;
        }, 0) / resolvedTickets.length
      : null;

  return NextResponse.json({
    total,
    open,
    inProgress,
    resolved,
    closed,
    overdue,
    avgResolutionHours,
    byTechnician: byTech,
  });
}
