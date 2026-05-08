"use client";
/**
 * PromoBanner — public site top-bar announcement.
 * Fetches active public promotions on mount; respects localStorage-keyed
 * per-promo dismissal.  Skips rendering on /portal/* routes automatically.
 * Uses the shared PromoBannerDisplay so the appearance is identical to the
 * admin preview.
 */
import { useEffect, useState } from "react";
import { PromoBannerDisplay, type PromoDisplayData } from "./PromoDisplay";

const LS_KEY = (id: string) => `promo-banner-dismissed-${id}`;

export function PromoBanner({ basePath }: { basePath: string }) {
  const [promo, setPromo] = useState<PromoDisplayData | null>(null);
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
        const items: PromoDisplayData[] = json.data ?? [];

        const banner = items.find(
          (p) => p.displayType === "banner" && p.id && !localStorage.getItem(LS_KEY(p.id!)),
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
    if (promo?.id) localStorage.setItem(LS_KEY(promo.id), "1");
    setVisible(false);
  }

  if (!promo || !visible) return null;

  return <PromoBannerDisplay promo={promo} onDismiss={dismiss} />;
}
