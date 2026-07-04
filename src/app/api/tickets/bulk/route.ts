import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { withErrorLogging } from "@/lib/errorLog";

// PATCH /api/tickets/bulk - update status on multiple tickets at once (technician/admin only)
export const PATCH = withErrorLogging("PATCH /api/tickets/bulk", async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "SUBMITTER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ticketIds, status } = await req.json();
  if (!Array.isArray(ticketIds) || ticketIds.length === 0 || !status) {
    return NextResponse.json({ error: "ticketIds and status are required" }, { status: 400 });
  }

  const data: any = { status };
  if (status === "RESOLVED") data.resolvedAt = new Date();

  await prisma.ticket.updateMany({
    where: { id: { in: ticketIds } },
    data,
  });

  await logAudit({
    action: "BULK_STATUS_CHANGED",
    detail: `${ticketIds.length} ticket(s) → ${status}`,
    actorId: (session.user as any).id,
  });

  return NextResponse.json({ updated: ticketIds.length });
});
