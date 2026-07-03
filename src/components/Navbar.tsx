"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          AUIS Helpdesk
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" && (
            <>
              <Link href="/tickets" className="text-slate-600 hover:text-slate-900">
                My Tickets
              </Link>
              <Link href="/tickets/new" className="text-slate-600 hover:text-slate-900">
                New Ticket
              </Link>
              {(session.user as any)?.role !== "SUBMITTER" && (
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                  Dashboard
                </Link>
              )}
              <span className="text-slate-400">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200"
              >
                Sign out
              </button>
            </>
          )}
          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("google")}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
            >
              Sign in with AUIS Google
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
