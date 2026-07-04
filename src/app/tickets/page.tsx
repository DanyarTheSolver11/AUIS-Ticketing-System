"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StatusBadge, PriorityBadge, PriorityStub } from "@/components/StatusBadge";
import PageContainer from "@/components/PageContainer";
import { useToast } from "@/components/Toast";

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
const BULK_TARGETS = ["IN_PROGRESS", "RESOLVED", "CLOSED"];

function isOverdue(dueAt: string | null, status: string) {
  if (!dueAt) return false;
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return new Date(dueAt).getTime() < Date.now();
}

export default function TicketsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const role = (session?.user as any)?.role;
  const canManage = role === "TECHNICIAN" || role === "ADMIN";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  async function load(p: number, status: string) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (status !== "ALL") params.set("status", status);
    const res = await fetch(`/api/tickets?${params}`);
    const data = await res.json();
    setTickets((prev) => (p === 1 ? data.tickets : [...prev, ...data.tickets]));
    setHasMore(data.hasMore);
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    load(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return tickets;
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [tickets, query]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function applyBulkStatus(status: string) {
    setBulkSaving(true);
    await fetch("/api/tickets/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketIds: Array.from(selected), status }),
    });
    showToast(`Updated ${selected.size} ticket${selected.size > 1 ? "s" : ""}`);
    setSelected(new Set());
    setBulkSaving(false);
    load(1, statusFilter);
    setPage(1);
  }

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
            placeholder="Search loaded tickets by title or category..."
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

      {canManage && selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-brass-100 bg-brass-50 px-4 py-2.5">
          <span className="text-sm font-medium text-navy-600">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            {BULK_TARGETS.map((s) => (
              <button
                key={s}
                onClick={() => applyBulkStatus(s)}
                disabled={bulkSaving}
                className="rounded-lg bg-navy px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-700 disabled:opacity-50"
              >
                Mark {s.replace("_", " ")}
              </button>
            ))}
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg px-3 py-1.5 text-xs text-navy-400 hover:text-navy"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading && tickets.length === 0 && <SkeletonList />}

      {!loading && filtered.length === 0 && <EmptyState hasTickets={tickets.length > 0} />}

      <div className="flex flex-col gap-2.5">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-navy-100 bg-white py-4 pl-5 pr-4 transition hover:border-navy-400 hover:shadow-sm"
          >
            <PriorityStub priority={t.priority} />
            {canManage && (
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggleSelect(t.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 flex-shrink-0 rounded border-navy-100"
              />
            )}
            <Link href={`/tickets/${t.id}`} className="flex min-w-0 flex-1 items-center gap-4">
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
          </div>
        ))}
      </div>

      {!loading && hasMore && !query && (
        <button
          onClick={() => {
            const next = page + 1;
            setPage(next);
            load(next, statusFilter);
          }}
          className="mt-4 w-full rounded-lg border border-navy-100 bg-white py-2.5 text-sm text-navy-600 hover:border-navy-400"
        >
          Load more
        </button>
      )}
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
        {hasTickets ? "No tickets match your search" : "No tickets yet"}
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
