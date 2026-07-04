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
  submitter: { name: string | null; email: string };
  assignee: { name: string | null; email: string } | null;
  attachments: { id: string; url: string; name: string }[];
  comments: Comment[];
};

const STATUS_FLOW = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const role = (session?.user as any)?.role;
  const canManage = role === "TECHNICIAN" || role === "ADMIN";

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

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

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    await fetch(`/api/tickets/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment }),
    });
    setNewComment("");
    setPosting(false);
    showToast("Comment posted");
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

  return (
    <PageContainer>
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50 px-6 py-3">
          <span className="font-mono text-xs text-navy-400">
            #{ticket.id.slice(-6).toUpperCase()}
          </span>
          <div className="flex gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="px-6 py-6">
          <h1 className="font-display text-xl font-semibold text-navy">{ticket.title}</h1>
          <p className="mt-1 text-sm text-navy-400">
            {ticket.category.replace("_", " ")} · filed by{" "}
            {ticket.submitter.name || ticket.submitter.email}
            {ticket.assignee && ` · assigned to ${ticket.assignee.name || ticket.assignee.email}`}
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
          <div className="border-t border-navy-100 bg-paper px-6 py-4">
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
            <div key={c.id} className="rounded-lg border border-navy-100 bg-white p-4">
              <p className="text-sm leading-relaxed text-ink">{c.body}</p>
              <p className="mt-2 text-xs text-navy-400">
                {c.author.name || c.author.email} ·{" "}
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} className="mt-4 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input"
          />
          <button
            type="submit"
            disabled={posting}
            className="flex-shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50"
          >
            Post
          </button>
        </form>
      </div>
    </PageContainer>
  );
}
