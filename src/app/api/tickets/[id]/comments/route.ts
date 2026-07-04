import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewComment } from "@/lib/email";
import { countRecentComments } from "@/lib/rateLimit";
import { withErrorLogging } from "@/lib/errorLog";

const COMMENT_RATE_LIMIT = { windowMinutes: 5, maxCount: 15 };

// POST /api/tickets/:id/comments
export const POST = withErrorLogging(
  "POST /api/tickets/[id]/comments",
  async (req: Request, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const recentCount = await countRecentComments(userId, COMMENT_RATE_LIMIT.windowMinutes);
    if (recentCount >= COMMENT_RATE_LIMIT.maxCount) {
      return NextResponse.json(
        { error: "You're posting comments quite fast — please slow down a bit." },
        { status: 429 }
      );
    }

    const { body: text, isInternal } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

    const role = (session.user as any).role;
    const internal = isInternal === true && (role === "TECHNICIAN" || role === "ADMIN");

    const comment = await prisma.comment.create({
      data: {
        body: text,
        isInternal: internal,
        ticketId: params.id,
        authorId: userId,
      },
      include: {
        author: { select: { name: true, email: true, role: true } },
        ticket: { include: { submitter: { select: { email: true } } } },
      },
    });

    if (!internal && comment.ticket.submitter.email !== session.user.email) {
      await notifyNewComment(
        comment.ticket.submitter.email,
        comment.ticket.title,
        params.id,
        comment.author.name || comment.author.email
      );
    }

    return NextResponse.json(comment, { status: 201 });
  }
);
