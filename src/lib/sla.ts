// SLA windows, in hours, per priority level.
// These are just sensible starting defaults — adjust to match whatever
// your IT department's actual SLA policy ends up being.
const SLA_HOURS: Record<string, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168, // 7 days
};

export function calculateDueDate(priority: string, from: Date = new Date()): Date {
  const hours = SLA_HOURS[priority] ?? SLA_HOURS.MEDIUM;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export function isOverdue(dueAt: Date | string | null, status: string): boolean {
  if (!dueAt) return false;
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return new Date(dueAt).getTime() < Date.now();
}
