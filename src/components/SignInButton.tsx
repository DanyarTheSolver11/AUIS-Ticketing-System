"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition hover:bg-navy-700"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.1 14.7 2 12 2 6.9 2 2.7 6.1 2.7 11.2s4.2 9.2 9.3 9.2c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.1-1.6H12Z"
        />
      </svg>
      Sign in with AUIS Google
    </button>
  );
}
