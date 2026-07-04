"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import PageContainer from "@/components/PageContainer";

type UploadedFile = { url: string; name: string; size?: number };

const CATEGORIES = [
  { value: "HARDWARE", label: "Hardware" },
  { value: "SOFTWARE", label: "Software" },
  { value: "NETWORK", label: "Network" },
  { value: "ACCOUNT_ACCESS", label: "Account / Access" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [priority, setPriority] = useState("MEDIUM");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, priority, attachmentUrls: files }),
    });

    if (!res.ok) {
      setError("Something went wrong submitting your ticket. Please try again.");
      setSubmitting(false);
      return;
    }

    const ticket = await res.json();
    router.push(`/tickets/${ticket.id}`);
  }

  return (
    <PageContainer>
      <p className="font-mono text-xs uppercase tracking-wider text-navy-400">New request</p>
      <h1 className="mb-8 font-display text-2xl font-semibold text-navy">
        What's going on?
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-navy-100 bg-white p-6">
        <Field label="Title">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wi-Fi not working in Building B, Room 204"
            className="input"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What happened? When did it start? Anything you've already tried?"
            className="input resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Attachments">
          <div className="rounded-lg border border-dashed border-navy-100 bg-paper p-4">
            <UploadButton
              endpoint="ticketAttachment"
              appearance={{
                button: "bg-navy hover:bg-navy-700 text-sm px-3 py-1.5 rounded-md",
                allowedContent: "text-navy-400 text-xs mt-1",
              }}
              onClientUploadComplete={(res) => {
                setFiles((prev) => [
                  ...prev,
                  ...res.map((f: any) => ({ url: f.ufsUrl ?? f.url, name: f.name, size: f.size })),
                ]);
              }}
              onUploadError={(err) => setError(`Upload failed: ${err.message}`)}
            />
            {files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm text-navy-600">
                    <PaperclipIcon className="h-3.5 w-3.5 text-navy-400" /> {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        {error && (
          <p className="rounded-lg bg-urgent/10 px-3 py-2 text-sm text-urgent">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit ticket"}
        </button>
      </form>
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-navy-600">{label}</span>
      {children}
    </label>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 12.5 14.5 6a3 3 0 1 1 4.24 4.24l-8 8a5 5 0 1 1-7.07-7.07L11.5 3.34"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
