"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";

type Stats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
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
      <p className="font-mono text-xs uppercase tracking-wider text-navy-400">Overview</p>
      <h1 className="mb-8 font-display text-2xl font-semibold text-navy">Dashboard</h1>

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
  accent?: "brass" | "navy" | "resolved";
}) {
  const dot =
    accent === "brass"
      ? "bg-brass"
      : accent === "navy"
      ? "bg-navy-400"
      : accent === "resolved"
      ? "bg-resolved"
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
