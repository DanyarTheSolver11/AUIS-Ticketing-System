import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as any).role;
  if (role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/users - list all users (admin only)
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { ticketsFiled: true, ticketsAssigned: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

// PATCH /api/admin/users - update a user's role (admin only)
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, role } = await req.json();
  if (!userId || !["SUBMITTER", "TECHNICIAN", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const currentUserId = (session.user as any).id;
  if (userId === currentUserId && role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can't demote yourself. Ask another admin to do this." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(user);
}
