import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "SUBMITTER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await prisma.ticket.findMany({
    include: {
      submitter: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID",
    "Title",
    "Category",
    "Priority",
    "Status",
    "Submitter",
    "Assignee",
    "Created At",
    "Due At",
    "Resolved At",
  ];

  const rows = tickets.map((t) =>
    [
      t.id,
      t.title,
      t.category,
      t.priority,
      t.status,
      t.submitter.name || t.submitter.email,
      t.assignee ? t.assignee.name || t.assignee.email : "",
      t.createdAt.toISOString(),
      t.dueAt ? t.dueAt.toISOString() : "",
      t.resolvedAt ? t.resolvedAt.toISOString() : "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="auis-helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
