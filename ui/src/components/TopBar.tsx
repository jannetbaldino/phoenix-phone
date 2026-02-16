import React from "react";
import { usePhone } from "../app/state";

export default function TopBar() {
  const phone = usePhone();
  const canGoBack = phone.nav.length > 1;

  return (
    <div style={bar}>
      <button
        style={btn(!canGoBack)}
        onClick={() => (canGoBack ? phone.pop() : null)}
        disabled={!canGoBack}
      >
        ◀
      </button>

      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        {phone.profile?.phone_number ?? "No Signal"}
      </div>

      <button style={btn(false)} onClick={() => phone.resetHome()}>
        ⌂
      </button>
    </div>
  );
}

const bar: React.CSSProperties = {
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 10px",
  borderBottom: "1px solid var(--border)",
  background: "rgba(0,0,0,0.12)"
};

const btn = (disabled: boolean): React.CSSProperties => ({
  width: 36,
  height: 30,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
  color: "var(--text)",
  cursor: disabled ? "default" : "pointer"
});
