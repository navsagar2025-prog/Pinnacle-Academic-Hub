export default function ParentPortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card border-l-4 border-l-slate-200">
            <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3" />
          </div>
        ))}
      </div>
      <div className="card space-y-0 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="h-4 w-28 bg-slate-200 rounded" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-50 last:border-0">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
