"use client";
/**
 * PromoBanner — public site top-bar.
 *
 * Fetches currently-active public promotions on mount.
 * Renders the first one as a dismissible sticky top bar.
 * Dismissal is stored in localStorage keyed by `promo-dismissed-{id}` so it
 * persists across page reloads.
 */
import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";

interface Promo {
  id: string;
  title: string;
  body: string;
  displayType: "banner" | "popup";
  ctaLabel: string | null;
  ctaUrl: string | null;
  bgColour: string;
  ctaColour: string;
}

const LS_KEY = (id: string) => `promo-dismissed-${id}`;

export function PromoBanner({ basePath }: { basePath: string }) {
  const [promo, setPromo] = useState<Promo | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Only show on public pages — not inside the portal.
    const basePart = basePath.replace(/\/$/, "");
    const relPath = window.location.pathname.startsWith(basePart)
      ? window.location.pathname.slice(basePart.length) || "/"
      : window.location.pathname;
    if (relPath.startsWith("/portal")) return;

    async function load() {
      try {
        const res = await fetch(`${basePath}/api/v1/promotions?audience=public`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const items: Promo[] = json.data ?? [];

        const banner = items.find(
          (p) => p.displayType === "banner" && !localStorage.getItem(LS_KEY(p.id)),
        );

        if (!cancelled && banner) {
          setPromo(banner);
          setVisible(true);
        }
      } catch {
        /* network error — silently ignore */
      }
    }

    load();
    return () => { cancelled = true; };
  }, [basePath]);

  function dismiss() {
    if (promo) localStorage.setItem(LS_KEY(promo.id), "1");
    setVisible(false);
  }

  if (!visible || !promo) return null;

  return (
    <div
      className="w-full z-50 flex items-center justify-between gap-3 px-4 py-2.5 text-white text-sm"
      style={{ backgroundColor: promo.bgColour }}
      role="banner"
      aria-label="Announcement"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone size={14} className="shrink-0 opacity-80" />
        <p className="font-semibold truncate">{promo.title}</p>
        <span className="hidden sm:inline text-white/80 text-xs truncate">— {promo.body}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {promo.ctaLabel && promo.ctaUrl && (
          <a
            href={promo.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1 rounded-full text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: promo.ctaColour }}
            onClick={dismiss}
          >
            {promo.ctaLabel}
          </a>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="text-white/60 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
