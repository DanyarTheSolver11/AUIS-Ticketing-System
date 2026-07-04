export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10 lg:px-12">{children}</div>
  );
}
