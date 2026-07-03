"use client";

import { useEffect, useState } from "react";

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

  if (!stats) return <p className="text-slate-500">Loading...</p>;

  const cards = [
    { label: "Total Tickets", value: stats.total },
    { label: "Open", value: stats.open },
    { label: "In Progress", value: stats.inProgress },
    { label: "Resolved", value: stats.resolved },
    { label: "Closed", value: stats.closed },
    {
      label: "Avg. Resolution Time",
      value: stats.avgResolutionHours ? `${stats.avgResolutionHours.toFixed(1)}h` : "—",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
