"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  submitter: { name: string | null; email: string };
  assignee: { name: string | null; email: string } | null;
  _count: { comments: number };
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Link
          href="/tickets/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Ticket
        </Link>
      </div>

      {loading && <p className="text-slate-500">Loading...</p>}
      {!loading && tickets.length === 0 && (
        <p className="text-slate-500">No tickets yet. Create your first one.</p>
      )}

      <div className="flex flex-col gap-3">
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium text-slate-900">{t.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t.category.replace("_", " ")} · Submitted by {t.submitter.name || t.submitter.email}
                  {t.assignee && ` · Assigned to ${t.assignee.name || t.assignee.email}`}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
