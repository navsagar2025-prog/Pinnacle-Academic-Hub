import { db } from "@workspace/db";
import { galleryItems } from "@workspace/db/schema";
import { asc, sql } from "drizzle-orm";
import { Images } from "lucide-react";
import { AddGalleryButton, EditGalleryButton, DeleteGalleryButton, VisibilityToggle } from "./GalleryModal";

export const metadata = { title: "Gallery — Admin Panel" };

export default async function AdminGalleryPage() {
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(galleryItems),
  ]);
  const visible = rows.filter((r) => r.isVisible).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Gallery</h1>
          <p className="text-slate-500 text-sm mt-1">{total} photos · {visible} visible on public site</p>
        </div>
        <AddGalleryButton />
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Images size={32} className="mx-auto mb-3 opacity-30" />
          <p>No gallery photos yet. Add your first photo to populate the public gallery page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((item) => (
            <div key={item.id} className={`card p-0 overflow-hidden group border transition-all ${item.isVisible ? "border-slate-100 hover:border-[var(--color-teal)]/30" : "border-dashed border-slate-200 opacity-60"}`}>
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={undefined}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <VisibilityToggle id={item.id} isVisible={item.isVisible} />
                </div>
                <div className="absolute top-2 left-2">
                  <span className="badge text-xs bg-[var(--color-navy)]/70 text-white border-0 backdrop-blur-sm">{item.category}</span>
                </div>
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-[var(--color-navy)] line-clamp-1">{item.title}</div>
                {item.caption && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.caption}</div>}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                  <span className="text-xs text-slate-300">#{item.sortOrder ?? 0}</span>
                  <div className="flex items-center gap-2">
                    <EditGalleryButton item={item} />
                    <DeleteGalleryButton id={item.id} title={item.title} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
