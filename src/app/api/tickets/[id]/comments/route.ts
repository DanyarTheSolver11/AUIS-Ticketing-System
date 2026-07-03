import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/tickets/:id/comments
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body: text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      body: text,
      ticketId: params.id,
      authorId: (session.user as any).id,
    },
    include: { author: { select: { name: true, email: true, role: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
