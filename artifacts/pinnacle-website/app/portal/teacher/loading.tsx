export default function TeacherPortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card border-l-4 border-l-slate-200">
            <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-20 bg-slate-200 rounded" />
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center px-4 py-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="ml-auto h-6 w-16 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
