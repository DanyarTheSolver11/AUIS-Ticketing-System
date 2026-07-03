"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canManage = role === "TECHNICIAN" || role === "ADMIN";

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) setTicket(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadTicket();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await fetch(`/api/tickets/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment }),
    });
    setNewComment("");
    loadTicket();
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!ticket) return <p className="text-slate-500">Ticket not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <div className="flex gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {ticket.category.replace("_", " ")} · Submitted by{" "}
        {ticket.submitter.name || ticket.submitter.email}
        {ticket.assignee && ` · Assigned to ${ticket.assignee.name || ticket.assignee.email}`}
      </p>

      <p className="mb-6 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-slate-800">
        {ticket.description}
      </p>

      {ticket.attachments.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-slate-700">Attachments</h3>
          <ul className="flex flex-col gap-1">
            {ticket.attachments.map((a) => (
              <li key={a.id}>
                <a href={a.url} target="_blank" className="text-sm text-indigo-600 hover:underline">
                  📎 {a.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && (
        <div className="mb-6 flex gap-2 rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm text-slate-600">Update status:</span>
          {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                ticket.status === s
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      )}

      <h3 className="mb-3 font-medium text-slate-900">Comments</h3>
      <div className="flex flex-col gap-3">
        {ticket.comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-sm text-slate-800">{c.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {c.author.name || c.author.email} · {new Date(c.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        {ticket.comments.length === 0 && (
          <p className="text-sm text-slate-400">No comments yet.</p>
        )}
      </div>

      <form onSubmit={submitComment} className="mt-4 flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Post
        </button>
      </form>
    </div>
  );
}
