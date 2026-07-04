"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/PageContainer";

type LogEntry = {
  id: string;
  action: string;
  detail: string;
  ticketId: string | null;
  createdAt: string;
  actor: { name: string | null; email: string } | null;
};

export default function AuditLogPage() {
  const { data: session } = useSession();
  const myRole = (session?.user as any)?.role;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(p: number) {
    setLoading(true);
    const res = await fetch(`/api/admin/audit?page=${p}`);
    if (res.ok) {
      const data = await res.json();
      setLogs((prev) => (p === 1 ? data.logs : [...prev, ...data.logs]));
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }

  useEffect(() => {
    load(1);
  }, []);

  if (myRole && myRole !== "ADMIN") {
    return (
      <PageContainer>
        <p className="text-navy-400">You need admin access to view this page.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <p className="font-mono text-xs uppercase tracking-wider text-navy-400">Manage</p>
      <h1 className="mb-1 font-display text-2xl font-semibold text-navy">Activity log</h1>
      <p className="mb-8 text-sm text-navy-400">
        A record of status changes, assignments, and role updates across the system.
      </p>

      {loading && logs.length === 0 ? (
        <div className="h-64 animate-pulse rounded-xl border border-navy-100 bg-white" />
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-navy-100 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink">
                  <span className="font-medium">{log.actor?.name || log.actor?.email || "System"}</span>{" "}
                  <span className="text-navy-400">{formatAction(log.action)}</span>{" "}
                  <span className="font-mono text-xs">{log.detail}</span>
                </p>
                {log.ticketId && (
                  <a
                    href={`/tickets/${log.ticketId}`}
                    className="text-xs text-navy-400 hover:text-navy hover:underline"
                  >
                    #{log.ticketId.slice(-6).toUpperCase()}
                  </a>
                )}
              </div>
              <span className="flex-shrink-0 text-xs text-navy-400">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <p className="text-sm text-navy-400">No activity recorded yet.</p>
          )}

          {hasMore && (
            <button
              onClick={() => {
                const next = page + 1;
                setPage(next);
                load(next);
              }}
              className="mt-2 self-center rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm text-navy-600 hover:border-navy-400"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    TICKET_CREATED: "created a ticket",
    STATUS_CHANGED: "changed status",
    PRIORITY_CHANGED: "changed priority",
    ASSIGNED: "updated assignment",
    ROLE_CHANGED: "changed a role",
    BULK_STATUS_CHANGED: "bulk-updated status on",
  };
  return map[action] || action.toLowerCase().replace(/_/g, " ");
}
