import React, { useEffect } from "react";
import { usePhone } from "../app/state";

export default function Toasts() {
  const phone = usePhone();

  useEffect(() => {
    if (phone.toasts.length === 0) return;
    const t = setTimeout(() => phone.removeToast(phone.toasts.length - 1), 2400);
    return () => clearTimeout(t);
  }, [phone.toasts.length]);

  return (
    <div style={wrap}>
      {phone.toasts.map((t, idx) => (
        <div key={idx} style={toast}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.title ?? "Notification"}</div>
          <div style={{ fontSize: 14 }}>{t.body ?? ""}</div>
        </div>
      ))}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "absolute",
  top: 52,
  left: 12,
  right: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  pointerEvents: "none"
};

const toast: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
};
