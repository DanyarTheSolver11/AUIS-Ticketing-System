import { prisma } from "./prisma";

const DEFAULTS: Record<string, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168, // 7 days
};

// Settings is a singleton row (id: 1). Created on first read if missing,
// so there's nothing to manually seed.
export async function getSlaHours(): Promise<Record<string, number>> {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    return {
      URGENT: settings.slaUrgentHours,
      HIGH: settings.slaHighHours,
      MEDIUM: settings.slaMediumHours,
      LOW: settings.slaLowHours,
    };
  } catch (err) {
    console.error("Falling back to default SLA hours:", err);
    return DEFAULTS;
  }
}

export async function calculateDueDate(priority: string, from: Date = new Date()): Promise<Date> {
  const hours = await getSlaHours();
  const windowHours = hours[priority] ?? DEFAULTS.MEDIUM;
  return new Date(from.getTime() + windowHours * 60 * 60 * 1000);
}

export function isOverdue(dueAt: Date | string | null, status: string): boolean {
  if (!dueAt) return false;
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return new Date(dueAt).getTime() < Date.now();
}
