import React, { useEffect, useRef } from "react";
import { usePhone } from "../app/state";

export default function Toasts() {
  const phone = usePhone();
  const list = phone.toasts ?? [];

  // track which toasts we already animated (per id)
  const animated = useRef<Set<string>>(new Set());

  // remove oldest toast after a short delay
  useEffect(() => {
    if (list.length === 0) return;

    const oldest = list[list.length - 1];
    if (!oldest?.id) return;

    const t = window.setTimeout(() => {
      phone.removeToast(oldest.id);
    }, 2400);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, list[list.length - 1]?.id]);

  // NOTE: return null is fine here because hooks already ran above
  if (list.length === 0) return null;

  return (
    <div style={wrap}>
      {list.map((t) => (
        <div
          key={t.id}
          ref={(el) => {
            if (!el) return;
            if (animated.current.has(t.id)) return;
            animated.current.add(t.id);

            // Web Animations API (works great in Chromium/FiveM)
            try {
              el.animate(
                [
                  { transform: "translateY(-6px)", opacity: 0 },
                  { transform: "translateY(0px)", opacity: 1 },
                ],
                { duration: 180, easing: "ease-out", fill: "both" }
              );
            } catch {
              // ignore if animation unsupported for some reason
            }
          }}
          style={toast}
        >
          <div style={toastTitle}>{t.title || "Notification"}</div>
          <div style={toastBody}>{t.body || ""}</div>
        </div>
      ))}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "absolute",
  top: 52, // below TopBar
  left: 12,
  right: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  pointerEvents: "none",
  zIndex: 20,
};

const toast: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.40)",
  color: "var(--text)",
};

const toastTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "var(--muted)",
};

const toastBody: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--text)",
  marginTop: 2,
};
