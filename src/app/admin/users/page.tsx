"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/PageContainer";
import { useToast } from "@/components/Toast";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: { ticketsFiled: number; ticketsAssigned: number };
};

const ROLES = ["SUBMITTER", "TECHNICIAN", "ADMIN"];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const myRole = (session?.user as any)?.role;

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(userId: string, role: string) {
    setSavingId(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      showToast("Role updated");
      load();
    } else {
      const data = await res.json();
      showToast(data.error || "Couldn't update role");
    }
    setSavingId(null);
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
      <h1 className="mb-1 font-display text-2xl font-semibold text-navy">People</h1>
      <p className="mb-8 text-sm text-navy-400">
        Everyone who has signed in gets Submitter access by default. Promote
        IT staff to Technician or Admin here.
      </p>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-navy-100 bg-white" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
                <th className="px-5 py-3">Person</th>
                <th className="px-5 py-3">Tickets filed</th>
                <th className="px-5 py-3">Assigned</th>
                <th className="px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-navy-100 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{u.name || "—"}</p>
                    <p className="text-xs text-navy-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-navy-600">{u._count.ticketsFiled}</td>
                  <td className="px-5 py-3.5 text-navy-600">{u._count.ticketsAssigned}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded-lg border border-navy-100 bg-white px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide text-navy-600 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
