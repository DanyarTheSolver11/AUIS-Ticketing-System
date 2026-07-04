import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { withErrorLogging } from "@/lib/errorLog";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export const GET = withErrorLogging("GET /api/admin/settings", async () => {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  return NextResponse.json(settings);
});

export const PATCH = withErrorLogging("PATCH /api/admin/settings", async (req: Request) => {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slaUrgentHours, slaHighHours, slaMediumHours, slaLowHours } = await req.json();

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: { slaUrgentHours, slaHighHours, slaMediumHours, slaLowHours },
    create: { id: 1, slaUrgentHours, slaHighHours, slaMediumHours, slaLowHours },
  });

  await logAudit({
    action: "SETTINGS_CHANGED",
    detail: "SLA windows updated",
    actorId: (session.user as any).id,
  });

  return NextResponse.json(settings);
});
