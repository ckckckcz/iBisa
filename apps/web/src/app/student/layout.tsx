export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-slate-100 text-slate-900">{children}</div>;
}
