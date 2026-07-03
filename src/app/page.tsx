import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/tickets");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-slate-900">AUIS IT Helpdesk</h1>
      <p className="max-w-md text-slate-600">
        Submit and track IT support requests across campus. Sign in with your
        AUIS Google account to get started.
      </p>
    </div>
  );
}
