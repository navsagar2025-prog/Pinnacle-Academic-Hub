"use client";
/**
 * Shared presentational primitives for promotions.
 * Used by BOTH the runtime components (PromoBanner, PromoPopup) and the
 * admin preview modal so admins see exactly what students/visitors will see.
 *
 * Body is stored as an HTML string (produced by the RichBodyEditor) and
 * rendered safely — only admins can author promotions, so the XSS risk is
 * the same as any other admin-controlled CMS content.
 */
import { X, Megaphone } from "lucide-react";

export interface PromoDisplayData {
  id?: string;
  title: string;
  body: string;
  displayType: "banner" | "popup";
  ctaLabel: string | null;
  ctaUrl: string | null;
  bgColour: string;
  ctaColour: string;
}

/** Top-bar dismissible banner — renders body as inline HTML snippet. */
export function PromoBannerDisplay({
  promo,
  onDismiss,
}: {
  promo: PromoDisplayData;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-white text-sm"
      style={{ backgroundColor: promo.bgColour }}
      role="banner"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone size={13} className="shrink-0 opacity-80" />
        <p className="font-semibold truncate">{promo.title}</p>
        {promo.body && (
          <span
            className="hidden sm:inline text-white/75 text-xs truncate [&_a]:underline [&_a]:text-white"
            dangerouslySetInnerHTML={{ __html: `— ${promo.body}` }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {promo.ctaLabel && promo.ctaUrl && (
          <a
            href={promo.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1 rounded-full text-white hover:opacity-90"
            style={{ backgroundColor: promo.ctaColour }}
          >
            {promo.ctaLabel}
          </a>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-white/60 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/** Full-screen modal popup. */
export function PromoPopupDisplay({
  promo,
  onClose,
}: {
  promo: PromoDisplayData;
  onClose?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
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
              onClick={onClose}
              className="text-white/60 hover:text-white shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div
            className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none [&_a]:text-[var(--color-teal)] [&_a]:underline [&_strong]:font-semibold [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: promo.body }}
          />
          {promo.ctaLabel && promo.ctaUrl && (
            <a
              href={promo.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="block w-full py-3 rounded-xl text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: promo.ctaColour }}
            >
              {promo.ctaLabel}
            </a>
          )}
          <button
            onClick={onClose}
            className="block w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact banner-style row used after modal is dismissed or for banner-type promos. */
export function PromoCompactBannerDisplay({
  promo,
  onDismiss,
}: {
  promo: PromoDisplayData;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-white text-sm"
      style={{ backgroundColor: promo.bgColour }}
      role="banner"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone size={13} className="shrink-0 opacity-80" />
        <p className="font-semibold truncate">{promo.title}</p>
        {promo.body && (
          <span
            className="hidden sm:inline text-white/75 text-xs truncate"
            dangerouslySetInnerHTML={{ __html: `— ${promo.body}` }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {promo.ctaLabel && promo.ctaUrl && (
          <a
            href={promo.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1 rounded-full text-white hover:opacity-90"
            style={{ backgroundColor: promo.ctaColour }}
            onClick={onDismiss}
          >
            {promo.ctaLabel}
          </a>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-white/60 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
