const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-brass-50 text-brass-600",
  IN_PROGRESS: "bg-navy-50 text-navy-600",
  RESOLVED: "bg-green-50 text-resolved",
  CLOSED: "bg-navy-50 text-navy-400",
};

const PRIORITY_BAR: Record<string, string> = {
  LOW: "bg-navy-100",
  MEDIUM: "bg-navy-400",
  HIGH: "bg-brass",
  URGENT: "bg-urgent",
};

const PRIORITY_TEXT: Record<string, string> = {
  LOW: "text-navy-400",
  MEDIUM: "text-navy-600",
  HIGH: "text-brass-600",
  URGENT: "text-urgent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${
        STATUS_STYLES[status] || ""
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wide ${PRIORITY_TEXT[priority] || ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_BAR[priority] || ""}`} />
      {priority}
    </span>
  );
}

// Left-edge color bar used on ticket stub cards — encodes priority at a glance
export function PriorityStub({ priority }: { priority: string }) {
  return <span className={`absolute inset-y-0 left-0 w-1 ${PRIORITY_BAR[priority] || ""}`} />;
}
