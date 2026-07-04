"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/tickets", label: "My Tickets", icon: TicketIcon },
  { href: "/tickets/new", label: "New Ticket", icon: PlusIcon },
];

const MANAGE_ITEMS = [{ href: "/dashboard", label: "Dashboard", icon: ChartIcon }];

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "People", icon: PeopleIcon },
  { href: "/admin/audit", label: "Activity Log", icon: LogIcon },
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (status !== "authenticated") return null;

  const role = (session.user as any)?.role;
  const canManage = role === "TECHNICIAN" || role === "ADMIN";
  const isAdmin = role === "ADMIN";
  const initials = (session.user?.name || session.user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile top bar — visible below the lg breakpoint only */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-navy-100 bg-white px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-600 hover:bg-navy-50"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded bg-navy text-xs font-semibold text-brass">
          AH
        </div>
        <p className="font-display text-sm font-semibold text-navy">AUIS Helpdesk</p>
      </div>

      {/* Backdrop, mobile only, shown while the drawer is open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-navy-900/40 lg:hidden"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-shrink-0 flex-col border-r border-navy-100 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-navy text-sm font-semibold text-brass">
            AH
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold leading-tight text-navy">
              AUIS Helpdesk
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={pathname === item.href}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>

          {canManage && (
            <div>
              <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-navy-400">
                Manage
              </p>
              <div className="space-y-0.5">
                {MANAGE_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    active={pathname === item.href}
                    onClick={() => setOpen(false)}
                  />
                ))}
                {isAdmin &&
                  ADMIN_ITEMS.map((item) => (
                    <NavLink
                      key={item.href}
                      {...item}
                      active={pathname === item.href}
                      onClick={() => setOpen(false)}
                    />
                  ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-navy-100 px-3 py-4">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brass-50 text-xs font-semibold text-brass-600">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{session.user?.name}</p>
              <p className="truncate text-xs text-navy-400">{role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-sm text-navy-400 transition hover:bg-navy-50 hover:text-navy"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-navy-700 text-white"
          : "text-navy-400 hover:bg-navy-50 hover:text-navy"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 7v10" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 20V10M12 20V4M20 20v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 8a3 3 0 1 1 0 6M22 20c0-2.8-2-5-4.5-5.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 6h16M4 12h16M4 18h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
