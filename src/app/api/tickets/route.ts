import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tickets - list tickets (scoped by role)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  // Submitters only see their own tickets. Technicians/Admins see everything.
  const where: any = {};
  if (role === "SUBMITTER") where.submitterId = userId;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      submitter: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

// POST /api/tickets - create a new ticket
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { title, description, category, priority, attachmentUrls } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      category: category || "OTHER",
      priority: priority || "MEDIUM",
      submitterId: userId,
      attachments: attachmentUrls?.length
        ? {
            create: attachmentUrls.map((a: { url: string; name: string; size?: number }) => ({
              url: a.url,
              name: a.name,
              size: a.size,
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  });

  return NextResponse.json(ticket, { status: 201 });
}
