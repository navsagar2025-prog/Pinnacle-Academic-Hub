"use client";

import { useState } from "react";
import { Bell, CheckCheck, BellOff, CreditCard, Calendar, BookOpen, FlaskConical, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  date: string;
  title: string;
  body: string;
  category: string;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Fee: <CreditCard size={15} />,
  Test: <FileText size={15} />,
  Academic: <BookOpen size={15} />,
  Event: <Calendar size={15} />,
  Admissions: <FlaskConical size={15} />,
  General: <Bell size={15} />,
};

const CATEGORY_COLOR: Record<string, string> = {
  Fee: "bg-red-100 text-red-700",
  Test: "bg-purple-100 text-purple-700",
  Academic: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Event: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Admissions: "bg-green-100 text-green-700",
  General: "bg-slate-100 text-slate-600",
};

export function NotificationsClient({ notices }: { notices: Notice[] }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notices.filter((n) => !readIds.has(n.id)).length;

  function markRead(id: string) {
    setReadIds((prev) => new Set([...prev, id]));
  }

  function markAllRead() {
    setReadIds(new Set(notices.map((n) => n.id)));
  }

  const shown = filter === "unread" ? notices.filter((n) => !readIds.has(n.id)) : notices;

  if (notices.length === 0) {
    return (
      <div className="card text-center py-12">
        <BellOff size={36} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              filter === "all" ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            All ({notices.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              filter === "unread" ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-[var(--color-teal)] hover:underline font-medium"
          >
            <CheckCheck size={15} />Mark all as read
          </button>
        )}
      </div>

      {shown.length === 0 && (
        <div className="card text-center py-10">
          <CheckCheck size={28} className="text-green-400 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">All caught up! No unread notifications.</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((n) => {
          const isRead = readIds.has(n.id);
          const cc = CATEGORY_COLOR[n.category] ?? "bg-slate-100 text-slate-600";
          const ci = CATEGORY_ICON[n.category] ?? <Bell size={15} />;
          return (
            <div
              key={n.id}
              className={cn(
                "card transition-all cursor-pointer hover:shadow-elevated",
                !isRead && "border-l-4 border-l-[var(--color-navy)]"
              )}
              onClick={() => markRead(n.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cc}`}>
                  {ci}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {!isRead && (
                        <span className="w-2 h-2 bg-[var(--color-navy)] rounded-full flex-shrink-0" />
                      )}
                      <span className="font-semibold text-[var(--color-navy)] text-sm">{n.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${cc}`}>{n.category}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{n.body}</p>
                  {!isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="mt-2 text-xs text-[var(--color-teal)] hover:underline font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
