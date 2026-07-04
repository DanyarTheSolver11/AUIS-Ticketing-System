import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewComment } from "@/lib/email";

// POST /api/tickets/:id/comments
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body: text, isInternal } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

  const role = (session.user as any).role;
  // Only technicians/admins can mark a note internal — submitters never can.
  const internal = isInternal === true && (role === "TECHNICIAN" || role === "ADMIN");

  const comment = await prisma.comment.create({
    data: {
      body: text,
      isInternal: internal,
      ticketId: params.id,
      authorId: (session.user as any).id,
    },
    include: {
      author: { select: { name: true, email: true, role: true } },
      ticket: { include: { submitter: { select: { email: true } } } },
    },
  });

  // Internal notes never trigger a notification to the submitter.
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
