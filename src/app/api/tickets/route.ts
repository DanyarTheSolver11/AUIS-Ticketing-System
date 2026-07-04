import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyTicketCreated } from "@/lib/email";
import { calculateDueDate } from "@/lib/sla";
import { countRecentTickets } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { withErrorLogging } from "@/lib/errorLog";

const PAGE_SIZE = 20;
const TICKET_RATE_LIMIT = { windowMinutes: 10, maxCount: 5 };

// GET /api/tickets - list tickets (scoped by role), paginated
export const GET = withErrorLogging("GET /api/tickets", async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  // Submitters only see their own tickets. Technicians/Admins see everything.
  const where: any = {};
  if (role === "SUBMITTER") where.submitterId = userId;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        submitter: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({
    tickets,
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: page * PAGE_SIZE < total,
  });
});

// POST /api/tickets - create a new ticket
export const POST = withErrorLogging("POST /api/tickets", async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const recentCount = await countRecentTickets(userId, TICKET_RATE_LIMIT.windowMinutes);
  if (recentCount >= TICKET_RATE_LIMIT.maxCount) {
    return NextResponse.json(
      {
        error: `You've submitted several tickets recently. Please wait a few minutes before submitting another, or add details to an existing ticket instead.`,
      },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { title, description, category, priority, attachmentUrls } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  const finalPriority = priority || "MEDIUM";
  const dueAt = await calculateDueDate(finalPriority);

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      category: category || "OTHER",
      priority: finalPriority,
      dueAt,
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

  await logAudit({
    action: "TICKET_CREATED",
    detail: `Ticket "${ticket.title}" created`,
    actorId: userId,
    ticketId: ticket.id,
  });

  await notifyTicketCreated(session.user.email!, ticket.title, ticket.id);

  return NextResponse.json(ticket, { status: 201 });
});
