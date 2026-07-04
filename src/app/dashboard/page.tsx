"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";

type Stats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number;
  avgResolutionHours: number | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <PageContainer>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-navy-400">Overview</p>
          <h1 className="font-display text-2xl font-semibold text-navy">Dashboard</h1>
        </div>
        <a
          href="/api/dashboard/export"
          className="rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm font-medium text-navy-600 transition hover:border-navy-400"
        >
          Export CSV
        </a>
      </div>

      {!stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-navy-100 bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Total tickets" value={stats.total} />
          <StatCard label="Open" value={stats.open} accent="brass" />
          <StatCard label="In progress" value={stats.inProgress} accent="navy" />
          <StatCard label="Resolved" value={stats.resolved} accent="resolved" />
          <StatCard label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? "urgent" : undefined} />
          <StatCard label="Closed" value={stats.closed} />
          <StatCard
            label="Avg. resolution"
            value={stats.avgResolutionHours ? `${stats.avgResolutionHours.toFixed(1)}h` : "—"}
          />
        </div>
      )}
    </PageContainer>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "brass" | "navy" | "resolved" | "urgent";
}) {
  const dot =
    accent === "brass"
      ? "bg-brass"
      : accent === "navy"
      ? "bg-navy-400"
      : accent === "resolved"
      ? "bg-resolved"
      : accent === "urgent"
      ? "bg-urgent"
      : "bg-navy-100";

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <p className="text-xs font-medium text-navy-400">{label}</p>
      </div>
      <p className="font-display text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}
