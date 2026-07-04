import { prisma } from "./prisma";

export async function logAudit(params: {
  action: string;
  detail: string;
  actorId?: string | null;
  ticketId?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        detail: params.detail,
        actorId: params.actorId ?? null,
        ticketId: params.ticketId ?? null,
      },
    });
  } catch (err) {
    // Audit logging should never break the actual request.
    console.error("Failed to write audit log:", err);
  }
}
