import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStatusChanged } from "@/lib/email";
import { calculateDueDate } from "@/lib/sla";
import { logAudit } from "@/lib/audit";
import { withErrorLogging } from "@/lib/errorLog";

// GET /api/tickets/:id
export const GET = withErrorLogging(
  "GET /api/tickets/[id]",
  async (_req: Request, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        submitter: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        attachments: true,
        comments: {
          include: { author: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role === "SUBMITTER" && ticket.submitterId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Submitters never see internal (technician-only) notes.
    if (role === "SUBMITTER") {
      ticket.comments = ticket.comments.filter((c) => !c.isInternal);
    }

    return NextResponse.json(ticket);
  }
);

// PATCH /api/tickets/:id - update status, priority, or assignee (technician/admin only)
export const PATCH = withErrorLogging(
  "PATCH /api/tickets/[id]",
  async (req: Request, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SUBMITTER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actorId = (session.user as any).id;
    const existing = await prisma.ticket.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { status, priority, assigneeId } = body;

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "RESOLVED") data.resolvedAt = new Date();
    }
    if (priority) {
      data.priority = priority;
      data.dueAt = await calculateDueDate(priority, new Date());
    }
    if (assigneeId !== undefined) data.assigneeId = assigneeId;

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data,
      include: { submitter: { select: { email: true } }, assignee: { select: { name: true, email: true } } },
    });

    if (status && status !== existing.status) {
      await logAudit({
        action: "STATUS_CHANGED",
        detail: `${existing.status} → ${status}`,
        actorId,
        ticketId: ticket.id,
      });
      await notifyStatusChanged(ticket.submitter.email, ticket.title, ticket.id, status);
    }
    if (priority && priority !== existing.priority) {
      await logAudit({
        action: "PRIORITY_CHANGED",
        detail: `${existing.priority} → ${priority}`,
        actorId,
        ticketId: ticket.id,
      });
    }
    if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
      await logAudit({
        action: "ASSIGNED",
        detail: assigneeId
          ? `Assigned to ${ticket.assignee?.name || ticket.assignee?.email}`
          : "Unassigned",
        actorId,
        ticketId: ticket.id,
      });
    }

    return NextResponse.json(ticket);
  }
);
