"use client";
/**
 * PromoPopup — student portal announcement overlay.
 *
 * Fetches currently-active student promotions on mount.
 * First visit of the day → full modal (localStorage-gated per promotion + date).
 * Subsequent same-day visits / after modal close → compact top banner until dismissed.
 * Full dismissal (banner X) stores a permanent localStorage key.
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

const MODAL_KEY = (id: string) => `promo-modal-shown-${id}`;
const BANNER_KEY = (id: string) => `promo-banner-dismissed-${id}`;
const todayStr = () => new Date().toISOString().split("T")[0];

export function PromoPopup({ basePath }: { basePath: string }) {
  const [promo, setPromo] = useState<Promo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${basePath}/api/v1/promotions?audience=student`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const items: Promo[] = json.data ?? [];

        const active = items.find((p) => !localStorage.getItem(BANNER_KEY(p.id)));
        if (!active || cancelled) return;

        const todayKey = `${MODAL_KEY(active.id)}-${todayStr()}`;
        const modalAlreadyShownToday = !!localStorage.getItem(todayKey);

        setPromo(active);
        if (!modalAlreadyShownToday) {
          setShowModal(true);
          localStorage.setItem(todayKey, "1");
        } else {
          setShowBanner(true);
        }
      } catch {
        /* silently ignore */
      }
    }

    load();
    return () => { cancelled = true; };
  }, [basePath]);

  function closeModal() {
    setShowModal(false);
    setShowBanner(true);
  }

  function dismissBanner() {
    if (promo) localStorage.setItem(BANNER_KEY(promo.id), "1");
    setShowBanner(false);
  }

  if (!promo) return null;

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 py-5 text-white"
              style={{ backgroundColor: promo.bgColour }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="opacity-80 shrink-0 mt-0.5" />
                  <h2 className="font-bold text-lg leading-tight">{promo.title}</h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/60 hover:text-white shrink-0 mt-0.5"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">{promo.body}</p>
              {promo.ctaLabel && promo.ctaUrl && (
                <a
                  href={promo.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeModal}
                  className="block w-full py-3 rounded-xl text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: promo.ctaColour }}
                >
                  {promo.ctaLabel}
                </a>
              )}
              <button
                onClick={closeModal}
                className="block w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {showBanner && !showModal && (
        <div
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-white text-sm"
          style={{ backgroundColor: promo.bgColour }}
          role="banner"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Megaphone size={13} className="shrink-0 opacity-80" />
            <p className="font-semibold truncate">{promo.title}</p>
            <span className="hidden sm:inline text-white/75 text-xs truncate">— {promo.body}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {promo.ctaLabel && promo.ctaUrl && (
              <a
                href={promo.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1 rounded-full text-white hover:opacity-90"
                style={{ backgroundColor: promo.ctaColour }}
                onClick={dismissBanner}
              >
                {promo.ctaLabel}
              </a>
            )}
            <button onClick={dismissBanner} aria-label="Dismiss" className="text-white/60 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
