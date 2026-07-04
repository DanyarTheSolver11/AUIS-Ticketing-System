"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import PageContainer from "@/components/PageContainer";
import { useToast } from "@/components/Toast";

type Comment = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { name: string | null; email: string; role: string };
};

type TicketDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  dueAt: string | null;
  submitter: { name: string | null; email: string };
  assignee: { name: string | null; email: string } | null;
  attachments: { id: string; url: string; name: string }[];
  comments: Comment[];
};

const STATUS_FLOW = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function isOverdue(dueAt: string | null, status: string) {
  if (!dueAt) return false;
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return new Date(dueAt).getTime() < Date.now();
}

function formatDue(dueAt: string) {
  const diffMs = new Date(dueAt).getTime() - Date.now();
  const hours = Math.abs(diffMs) / 36e5;
  const label = hours < 24 ? `${Math.round(hours)}h` : `${Math.round(hours / 24)}d`;
  return diffMs < 0 ? `${label} overdue` : `due in ${label}`;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const role = (session?.user as any)?.role;
  const myId = (session?.user as any)?.id;
  const canManage = role === "TECHNICIAN" || role === "ADMIN";

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  async function loadTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) setTicket(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(`Status updated to ${status.replace("_", " ").toLowerCase()}`);
    loadTicket();
  }

  async function claimTicket() {
    setClaiming(true);
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: myId }),
    });
    showToast("Ticket claimed");
    setClaiming(false);
    loadTicket();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    await fetch(`/api/tickets/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment, isInternal }),
    });
    setNewComment("");
    setIsInternal(false);
    setPosting(false);
    showToast(isInternal ? "Internal note added" : "Comment posted");
    loadTicket();
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="h-64 animate-pulse rounded-xl border border-navy-100 bg-white" />
      </PageContainer>
    );
  }
  if (!ticket) {
    return (
      <PageContainer>
        <p className="text-navy-400">Ticket not found.</p>
      </PageContainer>
    );
  }

  const overdue = isOverdue(ticket.dueAt, ticket.status);

  return (
    <PageContainer>
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 bg-navy-50 px-4 py-3 sm:px-6">
          <span className="font-mono text-xs text-navy-400">
            #{ticket.id.slice(-6).toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            {ticket.dueAt && (
              <span
                className={`font-mono text-[11px] font-medium uppercase tracking-wide ${
                  overdue ? "text-urgent" : "text-navy-400"
                }`}
              >
                {overdue && "⚠ "}
                {formatDue(ticket.dueAt)}
              </span>
            )}
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="px-6 py-6">
          <h1 className="font-display text-xl font-semibold text-navy">{ticket.title}</h1>
          <p className="mt-1 text-sm text-navy-400">
            {ticket.category.replace("_", " ")} · filed by{" "}
            {ticket.submitter.name || ticket.submitter.email}
            {ticket.assignee
              ? ` · assigned to ${ticket.assignee.name || ticket.assignee.email}`
              : canManage
              ? " · unassigned"
              : ""}
          </p>

          <p className="mt-5 whitespace-pre-wrap rounded-lg bg-paper p-4 text-sm leading-relaxed text-ink">
            {ticket.description}
          </p>

          {ticket.attachments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {ticket.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-600 hover:border-navy-400"
                >
                  📎 {a.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 bg-paper px-6 py-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-400">
                Update status
              </p>
              <div className="flex gap-2">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide transition ${
                      ticket.status === s
                        ? "bg-navy text-white"
                        : "bg-white text-navy-400 hover:bg-navy-50"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {!ticket.assignee && (
              <button
                onClick={claimTicket}
                disabled={claiming}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
              >
                {claiming ? "Claiming..." : "Claim this ticket"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-navy-400">
          {ticket.comments.length === 0
            ? "No comments yet"
            : `${ticket.comments.length} comment${ticket.comments.length > 1 ? "s" : ""}`}
        </p>

        <div className="flex flex-col gap-3">
          {ticket.comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-4 ${
                c.isInternal ? "border-brass-100 bg-brass-50" : "border-navy-100 bg-white"
              }`}
            >
              {c.isInternal && (
                <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-brass-600">
                  Internal note · not visible to submitter
                </p>
              )}
              <p className="text-sm leading-relaxed text-ink">{c.body}</p>
              <p className="mt-2 text-xs text-navy-400">
                {c.author.name || c.author.email} ·{" "}
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isInternal ? "Add an internal note..." : "Add a comment..."}
              className="input"
            />
            <button
              type="submit"
              disabled={posting}
              className="flex-shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50"
            >
              Post
            </button>
          </div>
          {canManage && (
            <label className="flex w-fit items-center gap-2 text-xs text-navy-400">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-navy-100"
              />
              Mark as internal note (technicians only)
            </label>
          )}
        </form>
      </div>
    </PageContainer>
  );
}
