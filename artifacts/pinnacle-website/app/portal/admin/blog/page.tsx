import { db } from "@workspace/db";
import { blogPosts } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";
import { FileText } from "lucide-react";
import { AddBlogPostButton, EditBlogPostButton, DeleteBlogPostButton, PublishToggleButton, EnhanceAllDraftsButton } from "./BlogModal";

export const metadata = { title: "Blog CMS — Admin Panel" };

export default async function AdminBlogPage() {
  const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(blogPosts);
  const published = rows.filter((r) => r.status === "published").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Blog CMS</h1>
          <p className="text-slate-500 text-sm mt-1">{total} posts · {published} published</p>
        </div>
        <div className="flex items-center gap-3">
          <EnhanceAllDraftsButton />
          <AddBlogPostButton />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p>No blog posts yet. Create your first post to start the Pinnacle faculty blog.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Title", "Category", "Author", "Read Time", "Status", "Published", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="font-semibold text-sm text-[var(--color-navy)] line-clamp-1">{p.title}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge text-xs bg-[var(--color-teal)]/10 text-[var(--color-teal)]">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{p.authorName}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{p.readMinutes} min</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${p.status === "published" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-slate-100 text-slate-500"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PublishToggleButton post={p} />
                        <EditBlogPostButton post={p} />
                        <DeleteBlogPostButton postId={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
