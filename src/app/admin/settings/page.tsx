"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/PageContainer";
import { useToast } from "@/components/Toast";

type Settings = {
  slaUrgentHours: number;
  slaHighHours: number;
  slaMediumHours: number;
  slaLowHours: number;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const myRole = (session?.user as any)?.role;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    showToast(res.ok ? "SLA settings saved" : "Couldn't save settings");
  }

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
      <h1 className="mb-1 font-display text-2xl font-semibold text-navy">SLA settings</h1>
      <p className="mb-8 text-sm text-navy-400">
        How many hours a ticket has before it's marked overdue, per priority
        level. New tickets and priority changes use these values.
      </p>

      {!settings ? (
        <div className="h-64 animate-pulse rounded-xl border border-navy-100 bg-white" />
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-navy-100 bg-white p-6">
          <SlaField
            label="Urgent"
            value={settings.slaUrgentHours}
            onChange={(v) => setSettings({ ...settings, slaUrgentHours: v })}
          />
          <SlaField
            label="High"
            value={settings.slaHighHours}
            onChange={(v) => setSettings({ ...settings, slaHighHours: v })}
          />
          <SlaField
            label="Medium"
            value={settings.slaMediumHours}
            onChange={(v) => setSettings({ ...settings, slaMediumHours: v })}
          />
          <SlaField
            label="Low"
            value={settings.slaLowHours}
            onChange={(v) => setSettings({ ...settings, slaLowHours: v })}
          />

          <button
            onClick={save}
            disabled={saving}
            className="mt-2 w-fit rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </PageContainer>
  );
}

function SlaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-navy-600">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
          className="w-24 rounded-lg border border-navy-100 px-3 py-1.5 text-right text-sm text-ink"
        />
        <span className="text-sm text-navy-400">hours</span>
      </div>
    </label>
  );
}
