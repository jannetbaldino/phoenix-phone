import React, { useMemo } from "react";
import { usePhone } from "../app/state";

type WallpaperDef = { key: string; label: string; css: string };

const WALLPAPERS: WallpaperDef[] = [
  {
    key: "midnight",
    label: "Midnight",
    css: "radial-gradient(1200px 800px at 20% 10%, rgba(120,160,255,0.35), transparent 55%), radial-gradient(900px 700px at 80% 30%, rgba(255,107,179,0.22), transparent 60%), linear-gradient(180deg, #0b0c12 0%, #0f1220 50%, #0a0b11 100%)",
  },
  {
    key: "aurora",
    label: "Aurora",
    css: "radial-gradient(900px 650px at 20% 20%, rgba(125,255,178,0.28), transparent 60%), radial-gradient(900px 650px at 80% 30%, rgba(120,160,255,0.28), transparent 60%), radial-gradient(900px 650px at 50% 90%, rgba(179,136,255,0.20), transparent 60%), linear-gradient(180deg, #081016 0%, #0b1220 60%, #070b12 100%)",
  },
  {
    key: "sunset",
    label: "Sunset",
    css: "radial-gradient(900px 650px at 20% 20%, rgba(255,209,102,0.32), transparent 60%), radial-gradient(900px 650px at 80% 25%, rgba(255,107,107,0.26), transparent 60%), radial-gradient(900px 650px at 60% 85%, rgba(255,107,179,0.20), transparent 60%), linear-gradient(180deg, #140a12 0%, #101028 55%, #070710 100%)",
  },
  {
    key: "steel",
    label: "Steel",
    css: "radial-gradient(800px 520px at 30% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(800px 520px at 70% 60%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(180deg, #0d0f14 0%, #0b0c10 100%)",
  },
  {
    key: "rose",
    label: "Rose",
    css: "radial-gradient(950px 700px at 30% 20%, rgba(255,107,179,0.32), transparent 60%), radial-gradient(900px 650px at 70% 40%, rgba(179,136,255,0.22), transparent 60%), linear-gradient(180deg, #0d0812 0%, #120a18 60%, #09070d 100%)",
  },
  {
    key: "mint",
    label: "Mint",
    css: "radial-gradient(950px 700px at 30% 20%, rgba(125,255,178,0.30), transparent 60%), radial-gradient(900px 650px at 70% 40%, rgba(120,160,255,0.18), transparent 60%), linear-gradient(180deg, #071014 0%, #07121a 60%, #050b10 100%)",
  },
];

function Row({
  title,
  desc,
  right,
  onClick,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" style={rowBtn} onClick={onClick}>
      <div style={{ minWidth: 0 }}>
        <div style={rowTitle}>{title}</div>
        {desc ? <div style={rowDesc}>{desc}</div> : null}
      </div>
      <div style={{ flex: "0 0 auto" }}>{right}</div>
    </button>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={toggleWrap(value)}
      aria-label="Toggle"
    >
      <div style={toggleDot(value)} />
    </button>
  );
}

export default function Settings() {
  const phone = usePhone();
  const s = phone.settings;

  const accentPresets = useMemo(
    () => ["#78a0ff", "#ff6bb3", "#7dffb2", "#ffd166", "#b388ff", "#ff6b6b"],
    []
  );

  return (
    <div style={screen}>
      <div style={header}>
        <div style={{ fontSize: 18, fontWeight: 850 }}>Settings</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Appearance & notifications
        </div>
      </div>

      <div style={card}>
        <div style={sectionTitle}>Wallpaper</div>

        <div style={wallGrid}>
          {WALLPAPERS.map((w) => {
            const active = s.wallpaper === w.key;
            return (
              <button
                key={w.key}
                type="button"
                style={wallTile(w.css, active)}
                onClick={() => phone.setSettings({ wallpaper: w.key })}
                title={w.label}
              >
                <div style={wallLabel(active)}>{w.label}</div>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Tip: we’re using gradient wallpapers so it stays FiveM-friendly.
        </div>
      </div>

      <div style={card}>
        <div style={sectionTitle}>Appearance</div>

        <Row
          title="Theme"
          desc={s.theme === "dark" ? "Dark mode" : "Light mode"}
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={pill(s.theme === "dark")}
                onClick={(e) => {
                  e.stopPropagation();
                  phone.setSettings({ theme: "dark" });
                }}
              >
                Dark
              </button>
              <button
                type="button"
                style={pill(s.theme === "light")}
                onClick={(e) => {
                  e.stopPropagation();
                  phone.setSettings({ theme: "light" });
                }}
              >
                Light
              </button>
            </div>
          }
        />

        <Row
          title="Accent color"
          desc="Highlights, badges, buttons"
          right={
            <div style={accentRow}>
              {accentPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={accentDot(c, s.accent.toLowerCase() === c.toLowerCase())}
                  onClick={(e) => {
                    e.stopPropagation();
                    phone.setSettings({ accent: c });
                  }}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
          }
        />

        <Row
          title="Solid UI"
          desc="Makes cards/buttons less transparent"
          right={
            <Toggle
              value={!!s.solidUi}
              onChange={(v) => phone.setSettings({ solidUi: v })}
            />
          }
        />
      </div>

      <div style={card}>
        <div style={sectionTitle}>Notifications</div>

        <Row
          title="Peek when phone is closed"
          desc="Shows the phone briefly with the notification"
          right={
            <Toggle
              value={!!s.notifPeek}
              onChange={(v) => phone.setSettings({ notifPeek: v })}
            />
          }
        />

        <Row
          title="Notification sound"
          desc="Toggle only (we’ll wire real sound later)"
          right={
            <Toggle
              value={!!s.notifSound}
              onChange={(v) => phone.setSettings({ notifSound: v })}
            />
          }
        />
      </div>
    </div>
  );
}

/* ------------------ styles ------------------ */

const screen: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  paddingRight: 4,
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
};

const header: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "var(--muted)",
  letterSpacing: 0.3,
};

const wallGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
};

const wallTile = (css: string, active: boolean): React.CSSProperties => ({
  height: 86,
  borderRadius: 18,
  border: active
    ? "2px solid rgba(255,255,255,0.85)"
    : "1px solid rgba(255,255,255,0.16)",
  backgroundImage: css,
  backgroundSize: "cover",
  backgroundPosition: "center",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  boxShadow: active ? "0 14px 26px rgba(0,0,0,0.35)" : "0 10px 20px rgba(0,0,0,0.22)",
});

const wallLabel = (active: boolean): React.CSSProperties => ({
  position: "absolute",
  left: 10,
  bottom: 10,
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  color: "white",
  background: active ? "var(--accentA)" : "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.16)",
});

const rowBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  cursor: "pointer",
};

const rowTitle: React.CSSProperties = {
  fontWeight: 850,
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const rowDesc: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  marginTop: 2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const pill = (active: boolean): React.CSSProperties => ({
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: active ? "var(--accentA)" : "rgba(255,255,255,0.06)",
  color: "white",
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
});

const accentRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const accentDot = (color: string, active: boolean): React.CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: 999,
  background: color,
  border: active ? "2px solid rgba(255,255,255,0.9)" : "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
});

const toggleWrap = (on: boolean): React.CSSProperties => ({
  width: 44,
  height: 24,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: on ? "var(--accentA)" : "rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  padding: 3,
  cursor: "pointer",
});

const toggleDot = (on: boolean): React.CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "white",
  transform: `translateX(${on ? 20 : 0}px)`,
  transition: "transform 140ms ease",
});
