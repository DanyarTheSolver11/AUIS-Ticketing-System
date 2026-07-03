import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tickets/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
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

  return NextResponse.json(ticket);
}

// PATCH /api/tickets/:id - update status, priority, or assignee (technician/admin only)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "SUBMITTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { status, priority, assigneeId } = body;

  const data: any = {};
  if (status) {
    data.status = status;
    if (status === "RESOLVED") data.resolvedAt = new Date();
  }
  if (priority) data.priority = priority;
  if (assigneeId !== undefined) data.assigneeId = assigneeId;

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(ticket);
}
