export default function Loading() {
  return <div role="status" className="mx-auto max-w-2xl space-y-4 p-6">
    <p className="text-sm font-medium text-slate-500">Cargando tu espacio…</p>
    {[0, 1, 2].map(i => <div key={i} aria-hidden="true" className="h-40 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />)}
  </div>;
}
