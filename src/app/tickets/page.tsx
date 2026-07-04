"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge, PriorityStub } from "@/components/StatusBadge";
import PageContainer from "@/components/PageContainer";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  dueAt: string | null;
  submitter: { name: string | null; email: string };
  assignee: { name: string | null; email: string } | null;
  _count: { comments: number };
};

const STATUS_FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function isOverdue(dueAt: string | null, status: string) {
  if (!dueAt) return false;
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return new Date(dueAt).getTime() < Date.now();
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchesQuery =
        !query.trim() ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [tickets, query, statusFilter]);

  return (
    <PageContainer>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-navy-400">Queue</p>
          <h1 className="font-display text-2xl font-semibold text-navy">Tickets</h1>
        </div>
        <Link
          href="/tickets/new"
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-navy-700"
        >
          + New Ticket
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or category..."
            className="w-full rounded-lg border border-navy-100 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-navy-400"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide transition ${
                statusFilter === s
                  ? "bg-navy text-white"
                  : "bg-white text-navy-400 hover:bg-navy-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading && <SkeletonList />}

      {!loading && filtered.length === 0 && <EmptyState hasTickets={tickets.length > 0} />}

      <div className="flex flex-col gap-2.5">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-navy-100 bg-white py-4 pl-5 pr-4 transition hover:border-navy-400 hover:shadow-sm"
          >
            <PriorityStub priority={t.priority} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-navy-400">
                  #{t.id.slice(-6).toUpperCase()}
                </span>
                <PriorityBadge priority={t.priority} />
              </div>
              <h2 className="mt-1 truncate font-medium text-ink group-hover:text-navy">
                {t.title}
              </h2>
              <p className="mt-0.5 truncate text-sm text-navy-400">
                {t.category.replace("_", " ")} · {t.submitter.name || t.submitter.email}
                {t.assignee && ` · assigned to ${t.assignee.name || t.assignee.email}`}
              </p>
            </div>
            {isOverdue(t.dueAt, t.status) && (
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-urgent">
                Overdue
              </span>
            )}
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}

function EmptyState({ hasTickets }: { hasTickets: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-100 bg-white py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50">
        <SearchIcon className="h-5 w-5 text-navy-400" />
      </div>
      <p className="font-medium text-ink">
        {hasTickets ? "No tickets match your filters" : "No tickets yet"}
      </p>
      <p className="mt-1 text-sm text-navy-400">
        {hasTickets
          ? "Try a different search term or clear the status filter."
          : "Submit your first request and it'll show up here."}
      </p>
      {!hasTickets && (
        <Link
          href="/tickets/new"
          className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-700"
        >
          Submit a ticket
        </Link>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-xl border border-navy-100 bg-white" />
      ))}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
