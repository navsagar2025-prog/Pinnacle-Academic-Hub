"use client";
/**
 * PromoPopup — student portal announcement overlay.
 *
 * Fetches currently-active student promotions on mount.
 * Respects displayType:
 *   - "banner"  → always renders as compact top bar (never modal)
 *   - "popup"   → first visit of the day → full modal; subsequent → compact bar
 *
 * Uses the shared PromoPopupDisplay / PromoCompactBannerDisplay so admins see
 * exactly what students see in the admin preview modal.
 */
import { useEffect, useState } from "react";
import {
  PromoPopupDisplay,
  PromoCompactBannerDisplay,
  type PromoDisplayData,
} from "./PromoDisplay";

const MODAL_KEY  = (id: string) => `promo-modal-shown-${id}`;
const BANNER_KEY = (id: string) => `promo-banner-dismissed-${id}`;
const todayStr   = () => new Date().toISOString().split("T")[0];

export function PromoPopup({ basePath }: { basePath: string }) {
  const [promo, setPromo]           = useState<PromoDisplayData | null>(null);
  const [showModal, setShowModal]   = useState(false);
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
        const items: PromoDisplayData[] = json.data ?? [];

        const active = items.find(
          (p) => p.id && !localStorage.getItem(BANNER_KEY(p.id!)),
        );
        if (!active || cancelled) return;

        setPromo(active);

        if (active.displayType === "banner") {
          // Banner-type promos: always compact bar, never modal.
          setShowBanner(true);
        } else {
          // Popup-type: modal on first daily visit, compact bar after.
          const todayKey = `${MODAL_KEY(active.id!)}-${todayStr()}`;
          const modalAlreadyShownToday = !!localStorage.getItem(todayKey);
          if (!modalAlreadyShownToday) {
            setShowModal(true);
            localStorage.setItem(todayKey, "1");
          } else {
            setShowBanner(true);
          }
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
    if (promo?.id) localStorage.setItem(BANNER_KEY(promo.id), "1");
    setShowBanner(false);
  }

  if (!promo) return null;

  return (
    <>
      {showModal && (
        <PromoPopupDisplay promo={promo} onClose={closeModal} />
      )}
      {showBanner && !showModal && (
        <PromoCompactBannerDisplay promo={promo} onDismiss={dismissBanner} />
      )}
    </>
  );
}
