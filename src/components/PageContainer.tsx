export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-20 sm:px-10 lg:px-12 lg:pt-10">{children}</div>
  );
}
