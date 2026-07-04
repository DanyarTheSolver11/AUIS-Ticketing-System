import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/tickets");

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-md">
        {/* Signature element: a literal ticket stub */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between bg-navy-700 px-6 py-4">
            <span className="font-mono text-xs tracking-widest text-brass">AUIS · IT DESK</span>
            <span className="font-mono text-xs text-navy-100">No. 000001</span>
          </div>

          <div className="relative bg-perforation bg-[length:1px_10px] bg-left bg-repeat-y px-6 pl-8 pt-8">
            <h1 className="font-display text-2xl font-semibold leading-tight text-navy">
              Support requests,
              <br />
              handled in one place.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-400">
              Submit an issue, track it to resolution, and hear back — all
              without leaving your inbox open. Built for students, faculty,
              and staff across AUIS.
            </p>
          </div>

          <div className="px-6 pb-8 pl-8 pt-6">
            <SignInButton />
            <p className="mt-3 text-center text-xs text-navy-400">
              Restricted to @auis.edu.krd accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
